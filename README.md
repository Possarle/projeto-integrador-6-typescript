# Projeto Integrador 6 — TypeScript

Migração de [Possarle/projeto-integrador-6](https://github.com/Possarle/projeto-integrador-6) para TypeScript, mantendo a separação entre rotas, controllers, services e models. Inclui interface web e CRUD completo de produtos com Express 5, Sequelize 6 e banco relacional SQLite.

## Executar

Requisitos: Node.js 22 ou superior e npm.

```bash
npm ci
npm run build
npm start
```

Abra **http://localhost:3000**. A interface permite cadastrar, listar, editar e excluir produtos, com confirmação antes da exclusão. O catálogo começa vazio. Os dados são gravados em `data/produtos.sqlite` e continuam disponíveis após reiniciar a aplicação. SQLite é um banco relacional e não exige instalar um servidor separado.

Para desenvolvimento: `npm run dev`. Alterações no TypeScript da interface exigem executar novamente `npm run build` e atualizar a página.

Variáveis de ambiente opcionais: `PORT` (padrão `3000`) e `DB_STORAGE` (padrão `data/produtos.sqlite`). A aplicação cria o diretório e as tabelas ausentes na inicialização, sem usar `force` ou `alter`. Para futuras alterações de esquema em bancos já existentes, deve-se criar uma migração; `sync()` não migra tabelas existentes.

## Requisitos implementados

- **TypeScript:** backend e código da interface com modo `strict`.
- **Interface:** formulário, tabela, estados vazio/erro, edição, exclusão confirmada e layout responsivo.
- **Sequelize:** model Produto com consultas e gravações no SQLite.
- **Banco relacional:** tabela `produtos`, chave primária autoincrementada e campos obrigatórios.
- **CRUD completo:** criação, listagem, consulta individual, atualização e exclusão.
- **Jest:** testes de integração com SQLite real, testes da interface com JSDOM e limite mínimo de **91%** para statements, branches, functions e lines.

## Testes e cobertura

```bash
npm test
npm run check
```

`npm test` executa o Jest e gera `coverage/index.html`, `coverage/lcov.info` e `coverage/coverage-summary.json`. `npm run check` também compila backend e frontend. A cobertura inclui todos os arquivos de `src` e `frontend`, exceto `src/index.ts`, que apenas inicia e encerra o processo HTTP. Não são excluídos controllers, services, models, rotas ou a lógica da interface.

Resultado local verificado: **43 testes aprovados**, com **100%** de statements, branches, functions e lines no escopo acima. A checagem visual em Chromium não foi realizada porque o navegador não estava disponível no ambiente; a interface foi validada com Jest/JSDOM.

Os testes exercitam operações HTTP até o banco, validações, respostas 400/404/413/500, erros de persistência, manutenção dos dados ao reabrir o SQLite, promoção e ações da interface. O banco em memória é recriado antes de cada teste de integração; o teste de persistência usa um arquivo temporário. Nenhum teste usa o banco da aplicação. O workflow em `.github/workflows/ci.yml` executa build e testes a cada push/PR e disponibiliza o relatório de cobertura como artefato.

## API

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/produtos` | Lista ordenada por id; 200 |
| GET | `/produtos/:id` | Consulta individual; 200 ou 404 |
| POST | `/produtos` | Criação; 201 e cabeçalho Location |
| PUT | `/produtos/:id` | Substituição de nome e preço; 200 ou 404 |
| DELETE | `/produtos/:id` | Exclusão; 204 sem corpo ou 404 |

POST e PUT recebem JSON:

```json
{ "nome": "Teclado", "preco": 180.50 }
```

O nome é aparado e deve ter entre 1 e 120 caracteres. O preço deve ser numérico, finito, entre 0 e 999999999.99, com até duas casas decimais. Campos extras são ignorados e o cliente não escolhe nem altera o id. PUT exige nome e preço. Dados inválidos retornam 400 e erros usam `{ "erro": "mensagem" }`. Ids inválidos ou inexistentes retornam 404. JSON malformado retorna 400 e corpo acima de 16 KB retorna 413.

### Verificação manual

1. Cadastre um produto pelo formulário.
2. Confirme sua presença na tabela e consulte `/produtos`.
3. Clique em **Editar**, altere nome/preço e salve.
4. Reinicie o servidor e confirme que a alteração permanece.
5. Clique em **Excluir**, confirme e confira a remoção.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `src/index.ts` | Inicialização do banco e servidor |
| `src/app.ts` | Express, interface e tratamento de erros |
| `src/config/database.ts` | Conexão Sequelize/SQLite |
| `src/models/produto.model.ts` | Tabela e regra de promoção |
| `src/services/produto.service.ts` | Validação e operações persistentes |
| `src/controllers/produto.controller.ts` | Requisições e respostas HTTP |
| `src/routes/produto.routes.ts` | Endpoints |
| `frontend/` | Comportamento da interface em TypeScript |
| `public/` | HTML/CSS; JavaScript gerado pelo build em `public/js` |
| `tests/` | Testes Jest da API e interface |

A regra original `estaEmPromocao()` permanece no model e retorna verdadeiro quando o preço é menor que 100; não aplica desconto. O array e os testes `node:test` do original foram substituídos por persistência Sequelize e Jest. O código do commit `091e12a8fa07a5ba99cc91b58b381913b65201c3` do repositório de origem foi importado em um commit separado antes da migração. O histórico anterior completo continua disponível no repositório original.

Este projeto acadêmico não implementa autenticação: execute localmente. Uma publicação para múltiplos usuários exigiria definir autenticação e permissões.
