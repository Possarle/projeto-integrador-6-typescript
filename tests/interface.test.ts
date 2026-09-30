/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import { iniciarCatalogo } from '../frontend/catalogo';

const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
const produto = { id: 1, nome: 'Mouse', preco: 49.9 };
let requisitar: jest.Mock;
let confirmar: jest.Mock;
function resposta(dados: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => dados };
}
function elemento<T extends HTMLElement>(seletor: string): T { return document.querySelector<T>(seletor)!; }
async function aguardar() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
function preencher() {
  elemento<HTMLInputElement>('#nome').value = ' Teclado ';
  elemento<HTMLInputElement>('#preco').value = '10';
}
function enviar() { elemento<HTMLFormElement>('#produto-form').dispatchEvent(new Event('submit', { cancelable: true })); }
beforeEach(() => {
  document.documentElement.innerHTML = html;
  requisitar = jest.fn().mockResolvedValue(resposta([produto]));
  confirmar = jest.fn().mockReturnValue(true);
});
afterEach(() => jest.restoreAllMocks());

test('lista com texto seguro, valor em reais e estado vazio', async () => {
  requisitar.mockResolvedValueOnce(resposta([{ ...produto, nome: '<img src=x onerror=alert(1)>' }]));
  await iniciarCatalogo(document, requisitar, confirmar);
  expect(elemento('#produtos').textContent).toContain('<img src=x onerror=alert(1)>');
  expect(document.querySelector('#produtos img')).toBeNull();
  expect(elemento('#produtos').textContent).toContain('49,90');
  requisitar.mockResolvedValueOnce(resposta([]));
  elemento<HTMLButtonElement>('#recarregar').click();
  await aguardar();
  expect(elemento('#vazio').hidden).toBe(false);
  expect(elemento('#total').textContent).toBe('0');
});

test('cadastro, edição e cancelamento pelo formulário', async () => {
  await iniciarCatalogo(document, requisitar, confirmar);
  preencher();
  requisitar.mockResolvedValueOnce(resposta(produto, 201));
  enviar();
  await aguardar();
  expect(requisitar).toHaveBeenCalledWith('/produtos', expect.objectContaining({ method: 'POST', body: JSON.stringify({ nome: 'Teclado', preco: 10 }) }));
  expect(elemento('#mensagem').textContent).toContain('sucesso');
  elemento<HTMLButtonElement>('[aria-label="Editar Mouse"]').click();
  expect(elemento<HTMLInputElement>('#nome').value).toBe('Mouse');
  expect(elemento('#cancelar').hidden).toBe(false);
  preencher();
  requisitar.mockResolvedValueOnce(resposta(produto));
  enviar();
  await aguardar();
  expect(requisitar).toHaveBeenCalledWith('/produtos/1', expect.objectContaining({ method: 'PUT' }));
  elemento<HTMLButtonElement>('[aria-label="Editar Mouse"]').click();
  elemento<HTMLButtonElement>('#cancelar').click();
  expect(elemento<HTMLInputElement>('#nome').value).toBe('');
  expect(elemento('#titulo-form').textContent).toBe('Novo produto');
});

test.each([true, false])('exclusão confirmada, editando=%s', async editando => {
  await iniciarCatalogo(document, requisitar, confirmar);
  if (editando) elemento<HTMLButtonElement>('[aria-label="Editar Mouse"]').click();
  requisitar.mockResolvedValueOnce(resposta(undefined, 204)).mockResolvedValueOnce(resposta([]));
  elemento<HTMLButtonElement>('[aria-label="Excluir Mouse"]').click();
  await aguardar();
  expect(requisitar).toHaveBeenCalledWith('/produtos/1', { method: 'DELETE' });
  expect(elemento('#vazio').hidden).toBe(false);
  expect(elemento('#mensagem').textContent).toContain('excluído');
});

test('cancelar exclusão não envia requisição', async () => {
  await iniciarCatalogo(document, requisitar, confirmar);
  confirmar.mockReturnValue(false);
  elemento<HTMLButtonElement>('[aria-label="Excluir Mouse"]').click();
  expect(requisitar).toHaveBeenCalledTimes(1);
});

test('falha ao excluir apresenta erro e libera botões', async () => {
  await iniciarCatalogo(document, requisitar, confirmar);
  requisitar.mockResolvedValueOnce(resposta({ erro: 'Produto não encontrado' }, 404));
  elemento<HTMLButtonElement>('[aria-label="Excluir Mouse"]').click();
  await aguardar();
  expect(elemento('#mensagem').textContent).toBe('Produto não encontrado');
  expect(elemento<HTMLButtonElement>('#salvar').disabled).toBe(false);
});

test('falha no cadastro preserva formulário e permite nova tentativa', async () => {
  await iniciarCatalogo(document, requisitar, confirmar);
  preencher();
  requisitar.mockRejectedValueOnce(new Error('Sem conexão'));
  enviar();
  await aguardar();
  expect(elemento('#mensagem').textContent).toBe('Sem conexão');
  expect(elemento<HTMLInputElement>('#nome').value).toBe(' Teclado ');
  expect(elemento<HTMLButtonElement>('#salvar').disabled).toBe(false);
});

test('falha inicial e falha sem objeto Error', async () => {
  requisitar.mockRejectedValueOnce('falha');
  await iniciarCatalogo(document, requisitar, confirmar);
  expect(elemento('#mensagem').dataset.tipo).toBe('erro');
  expect(elemento('#mensagem').textContent).toContain('Não foi possível');
  expect(elemento('#vazio').textContent).toContain('Tente atualizar');
});

test('impede formulário inválido e submissões duplicadas', async () => {
  await iniciarCatalogo(document, requisitar, confirmar);
  enviar();
  expect(requisitar).toHaveBeenCalledTimes(1);
  preencher();
  let resolver!: (valor: unknown) => void;
  requisitar.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
  enviar();
  enviar();
  expect(requisitar).toHaveBeenCalledTimes(2);
  resolver(resposta(produto, 201));
  await aguardar();
  expect(elemento<HTMLButtonElement>('#salvar').disabled).toBe(false);
});

test('entrada principal inicializa o catálogo', async () => {
  window.fetch = requisitar;
  await import('../frontend/main');
  await aguardar();
  expect(requisitar).toHaveBeenCalledWith('/produtos', undefined);
});
