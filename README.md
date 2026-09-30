# Projeto Integrador 6 — API de Produtos

API em Node.js e Express organizada em rotas, controller, service e model, conforme a atividade. Os produtos ficam em um array na memória. Ao reiniciar o servidor, os cadastros são perdidos e os dois produtos iniciais são carregados novamente.

## Executar

Com Node.js 22 ou superior e npm instalados:

```bash
npm install
npm start
```

A API fica em `http://localhost:3000`. Para reiniciar automaticamente durante o desenvolvimento, use `npm run dev`. Para executar os testes, use `npm test`.

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `index.js` | Iniciar o servidor na porta 3000 |
| `app.js` | Configurar Express, JSON e rotas |
| `routes/produto.routes.js` | Associar os endpoints às funções do controller |
| `controllers/produto.controller.js` | Ler a requisição e devolver a resposta HTTP |
| `services/produto.service.js` | Validar, buscar e cadastrar produtos no array |
| `models/produto.model.js` | Representar um produto e seu comportamento |
| `test/produtos.test.js` | Verificar os endpoints e a regra de promoção |

## Endpoints

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/produtos` | Lista de produtos, status 200 |
| GET | `/produtos/:id` | Produto, status 200, ou erro 404 se não existir |
| POST | `/produtos` | Produto criado, status 201, ou erro 400 para dados inválidos |

No POST, envie `Content-Type: application/json` com um corpo como:

```json
{
  "nome": "Teclado",
  "preco": 180
}
```

O nome deve ser um texto não vazio e o preço deve ser um número finito maior ou igual a zero. O id é gerado pelo service. Campos extras não são armazenados. As respostas de erro usam a propriedade `erro`.

### Testar no Postman

1. Faça `GET http://localhost:3000/produtos` para listar Notebook e Mouse.
2. Faça `GET http://localhost:3000/produtos/1` para consultar o Notebook.
3. Faça `POST http://localhost:3000/produtos`, escolha Body > raw > JSON e envie o exemplo acima.
4. Consulte o id retornado pelo POST usando GET.
5. Consulte um id inexistente para receber 404. Envie um POST sem nome ou com preço em texto para receber 400.

## Perguntas da atividade

**Onde fica a regra de validação?** No service, dentro de `criar`. Assim, a regra fica separada do HTTP.

**Quem conhece req.params e req.body?** O controller. Ele lê o id em `req.params.id` e os dados do cadastro em `req.body`, passando esses valores ao service.

**Quem decide o status HTTP?** O controller decide os status das operações de produtos. O app também responde 404 para rotas desconhecidas e 400 para JSON malformado.

**O Model precisa existir sem banco?** Não. Nesta atividade ele é opcional. A classe Produto foi incluída para representar id, nome e preço e demonstrar o método `estaEmPromocao`, que retorna verdadeiro quando o preço é menor que 100, como no exemplo da aula. Esse método não altera o preço nem cria um desconto.

**O que muda ao adicionar um banco?** O array é substituído por consultas e gravações em um model de ORM ou repository. O service passa a usar essa persistência, geralmente com operações assíncronas. As rotas e a responsabilidade HTTP do controller continuam separadas. Banco de dados não faz parte desta etapa.
