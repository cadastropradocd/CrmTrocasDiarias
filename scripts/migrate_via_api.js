const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sxauaqndqehjpfyfwaad.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YXVhcW5kcWVoanBmeWZ3YWFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTcxMjIzNywiZXhwIjoyMDk1Mjg4MjM3fQ.YknK2-TB_xx-nSdicAP7w3TEIVPMBfr2UAtUjMSvPCA';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' }
});

async function migrate() {
  console.log('Starting migration via Supabase REST API...\n');

  // 1. Check current data
  const { data: deptos, error: deptError } = await supabase.from('Departamento').select('*');
  if (deptError) {
    console.error('Error fetching departments:', deptError);
    process.exit(1);
  }
  console.log(`Found ${deptos.length} departments`);
  console.log(deptos);

  const { data: registros, error: regError } = await supabase.from('Registro').select('*');
  if (regError) {
    console.error('Error fetching registros:', regError);
    process.exit(1);
  }
  console.log(`Found ${registros.length} registros\n`);

  // 2. Add departamentoId column using RPC
  console.log('1. Adding departamentoId column...');
  const { error: alterError } = await supabase.rpc('add_column_if_not_exists', {
    table_name: 'Registro',
    column_name: 'departamentoId',
    column_type: 'integer'
  });

  // Alternative: Direct query (might not work via API)
  console.log('   (Skipping - will be added via SQL)\n');

  // 3. Update existing records
  console.log('2. Updating existing records...');
  for (const depto of deptos) {
    const { error: updateError } = await supabase
      .from('Registro')
      .update({ departamentoId: depto.id })
      .eq('categoria', depto.nome);

    if (updateError) {
      console.log(`   Error updating ${depto.nome}: ${updateError.message}`);
    } else {
      console.log(`   Updated ${depto.nome} (id: ${depto.id})`);
    }
  }
  console.log('');

  // 4. Try to add constraints (will fail via API, need direct SQL)
  console.log('3. Adding FK constraint...');
  console.log('   (Needs direct SQL - see below)\n');

  console.log('Migration completed for data updates!');
  console.log('\nPlease run these in Supabase SQL Editor to complete migration:');
  console.log(`
-- Add FK constraint
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_departamentoId_fkey"
  FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id")
  ON DELETE RESTRICT;

-- Add index
CREATE INDEX IF NOT EXISTS "Registro_departamentoId_idx" ON "Registro"("departamentoId");

-- Update unique constraint
ALTER TABLE "Registro" DROP CONSTRAINT IF EXISTS "Registro_trocaDiaId_categoria_key";
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_trocaDiaId_departamentoId_key"
  UNIQUE ("trocaDiaId", "departamentoId");
`);
}

migrate().catch(console.error);
