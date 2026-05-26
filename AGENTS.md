- Sempre responder em PT-BR
- Sempre que for fazer alguma coisa use as skills e sempre faça seguindo boas praticas

1. Pense antes de codificar
Não presuma. Não esconda confusão. Compensações superficiais.

Os LLMs geralmente escolhem uma interpretação silenciosamente e a executam. Este princípio força o raciocínio explícito:

Suposições estatais explicitamente — Se não tiver certeza, pergunte em vez de adivinhar
Apresentar múltiplas interpretações — Não escolha silenciosamente quando houver ambiguidade
Empurre para trás quando necessário — Se existir uma abordagem mais simples, diga
Pare quando estiver confuso — Nomeie o que não está claro e peça esclarecimentos
2. Simplicidade Primeiro
Código mínimo que resolve o problema. Nada especulativo.

Combater a tendência à engenharia excessiva:

Nenhuma característica além do que foi perguntado
Sem abstrações para código de uso único
Nenhuma "flexibilidade" ou "configurabilidade" que não tenha sido solicitada
Nenhum tratamento de erros para cenários impossíveis
Se 200 linhas podem ser 50, reescreva-o
O teste: Um engenheiro sênior diria que isso é muito complicado? Se sim, simplifique.

3. Alterações Cirúrgicas
Toque apenas no que você deve. Limpe apenas sua própria bagunça.

Ao editar o código existente:

Não "melhore" código, comentários ou formatação adjacentes
Não refatore coisas que não estão quebradas
Combine o estilo existente, mesmo que você faça isso de maneira diferente
Se você notar um código morto não relacionado, mencione-o — não o exclua
Quando suas mudanças criam órfãos:

Remova importações/variáveis/funções que SUAS alterações tornaram não utilizadas
Não remova o código morto pré-existente, a menos que seja solicitado
O teste: Cada linha alterada deve rastrear diretamente a solicitação do usuário.

4. Execução orientada por objetivos
Definir critérios de sucesso. Faça um loop até que seja verificado.

Transforme tarefas imperativas em metas verificáveis:

Em vez de...	Transformar para...
"Adicionar validação"	"Escreva testes para entradas inválidas e faça-os passar"
"Corrigir o bug"	"Escreva um teste que o reproduza e depois faça-o passar"
"Refator X"	"Garantir que os testes sejam aprovados antes e depois"
Para tarefas de várias etapas, indique um breve plano:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Fortes critérios de sucesso permitem que o LLM faça um loop independente. Critérios fracos ("faça funcionar") exigem esclarecimentos constantes.