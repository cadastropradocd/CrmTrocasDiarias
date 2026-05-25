# Sprint 2: Funcionalidades de Usabilidade e Exportação

## 1. Contexto do Projeto

**Projeto:** Relatório de Trocas Diário
**Stack:** Next.js 16.2.6, React 19, TypeScript, Prisma 7, SQLite, JWT, Chart.js 4

**Status Sprint 1:** Autenticação estabilizada (Cookie HttpOnly + sessionStorage para APIs). Loop infinito corrigido.

## 2. Objetivo do Sprint 2

Adicionar funcionalidades práticas que melhoram a experiência do usuário diário:
1. **Exportação PDF** do relatório do dia
2. **Comparativo semanal** (gráfico com evolução dos últimos 7 dias)
3. **Navegação por calendário** (visualizar qualquer dia facilmente)
4. **Indicadores visuais de tendência** (setas coloridas mostrando evolução)

## 3. Tarefas

### 3.1 Exportação PDF do Relatório

**Arquivos a modificar/criar:**
- `app/components/ExportButton.tsx` — novo componente
- `app/api/export/route.ts` — novo endpoint para geração

**Funcionalidade:**
- Botão "Exportar PDF" no header do Dashboard (apenas admin)
- Usa `html-to-image` + `jspdf` (ou similar) para gerar PDF
- Inclui: data, tabela completa, KPIs, gráfico
- Nome do arquivo: `trocas-YYYY-MM-DD.pdf`

**Dependência:** Precisa instalar `jspdf` se não houver biblioteca similar.

---

### 3.2 Gráfico Comparativo Semanal

**Arquivo a modificar:** `app/components/Dashboard.tsx`

**Funcionalidade:**
- Novo card "Evolução Semanal" abaixo do gráfico principal
- Gráfico de linha mostrando total realizado dos últimos 7 dias
- Segunda linha mostrando meta total dos últimos 7 dias
-Tooltips mostrando data e valores ao passar mouse

**Lógica:**
- Buscar dados via `GET /api/historico` para listar datas disponíveis
- Filtrar últimos 7 dias (ou todos disponíveis se menos de 7)
- Agregar totais por dia

---

### 3.3 Navegação por Calendário

**Arquivo a modificar:** `app/components/DateSelector.tsx`

**Funcionalidade:**
- Substituir o seletor de data simples por um mini-calendário
- Meses navegáveis (prev/next)
- Dias com dados salvos highlighted em verde
- Clique no dia abre os dados daquele dia

**UI:** Estilo dark theme consistente, ocupando espaço mínimo mas expandível.

---

### 3.4 Indicadores de Tendência

**Arquivo a modificar:** `app/components/Dashboard.tsx`

**Funcionalidade:**
- Para cada categoria, comparar com o dia anterior
- Mostrar seta ↑ verde se melhorou, ↓ vermelho se piorou, → cinza se igual
- No KPI total, mostrar variação percentual vs dia anterior

**Implementação:**
- Comparar `totalRealizado` de hoje com `totalRealizado` de ontem
- Calcular percentual de variação
- Exibir no card de diferença: "+2,5% vs ontem" ou "-1,3% vs ontem"

---

## 4. Estrutura de Arquivos

```
app/
├── api/
│   ├── historico/route.ts     # Já existe - verificar se retorna totais por dia
│   └── export/route.ts        # NOVO: Geração de PDF
├── components/
│   ├── Dashboard.tsx          # MODIFICADO: Adicionar gráfico semanal + tendência
│   ├── DateSelector.tsx       # MODIFICADO: Substituir por calendário
│   ├── ExportButton.tsx       # NOVO: Botão de exportar PDF
│   └── Toast.tsx              # Já existe
```

## 5. API Changes

### 5.1 GET /api/historico (extensão)

**Atual:** Retorna lista de datas disponíveis.

**Modificar para:** Retornar também totais por dia para facilitar o gráfico semanal.

```typescript
// Response atual: string[]
// Novo response:
{
  datas: string[], // ["2026-05-25", "2026-05-24", ...]
  totais: Record<string, { realizado: number; meta: number }> // { "2026-05-25": { realizado: 1500, meta: 1400 }, ... }
}
```

### 5.2 GET /api/export

**Novo endpoint:**
- Query param: `date=YYYY-MM-DD`
- Retorna HTML renderizado ou usa client-side para gerar PDF
- Decidir: server-side com puppeteer ou client-side com html-to-image?

**Recomendação:** Client-side com `html-to-image` + `jspdf` é mais simples e não requer servidor headless.

## 6. Dependências a Instalar

```bash
npm install jspdf
```

## 7. Critérios de Aceitação

1. **Export PDF:**
   - [ ] Botão visível no header admin
   - [ ] PDF gerado com tabela, KPIs e data corretos
   - [ ] Nome do arquivo contém a data

2. **Gráfico Semanal:**
   - [ ] Exibe linha de realizado e meta dos últimos 7 dias
   - [ ] tooltips funcionais
   - [ ] Fallback se menos de 2 dias de dados

3. **Calendário:**
   - [ ] Navegação por meses funcional
   - [ ] Dias com dados highlighted
   - [ ] Click abre dados daquele dia

4. **Tendência:**
   - [ ] Cada categoria mostra tendência vs dia anterior
   - [ ] KPI total mostra variação percentual

## 8. Instruções para Execução

1. Começar pela **modificação do DateSelector** (calendário) — impacto visual imediato
2. Depois **gráfico semanal** — adiciona valor analítico
3. Depois **indicadores de tendência** — melhoria de UX
4. Por último **export PDF** — funcionalidade extra

Manter tipagem TypeScript rigorosa e estilo dark theme consistente.

## 9. Notas Técnicas

- Para o calendário, considerar usar `date-fns` para manipulação de datas se necessário
- Para o gráfico semanal, verificar se `chart.js` suporta Mixed charts (bar + line) ou criar dois datasets no mesmo chart
- Para export PDF, garantir que o elemento HTML está totalmente renderizado antes de capturar (usar timeout ou MutationObserver)

---

**Estimativa:** 4 tarefas principais, ~2-3 dias de desenvolvimento com testes.