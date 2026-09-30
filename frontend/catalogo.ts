export interface Produto { id: number; nome: string; preco: number }

export function iniciarCatalogo(doc: Document, requisitar: typeof fetch, confirmar: (mensagem: string) => boolean) {
  const form = doc.querySelector<HTMLFormElement>('#produto-form')!;
  const nome = doc.querySelector<HTMLInputElement>('#nome')!;
  const preco = doc.querySelector<HTMLInputElement>('#preco')!;
  const salvar = doc.querySelector<HTMLButtonElement>('#salvar')!;
  const cancelar = doc.querySelector<HTMLButtonElement>('#cancelar')!;
  const lista = doc.querySelector<HTMLTableSectionElement>('#produtos')!;
  const mensagem = doc.querySelector<HTMLElement>('#mensagem')!;
  const vazio = doc.querySelector<HTMLElement>('#vazio')!;
  let editando: number | null = null;
  let ocupado = false;

  function avisar(texto: string, tipo = 'sucesso'): void {
    mensagem.textContent = texto;
    mensagem.dataset.tipo = tipo;
  }
  function erroFalha(erro: unknown): void {
    avisar(erro instanceof Error ? erro.message : 'Não foi possível concluir a operação', 'erro');
  }
  async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const resposta = await requisitar(url, init);
    if (!resposta.ok) {
      const dados = await resposta.json() as { erro: string };
      throw new Error(dados.erro);
    }
    return resposta.status === 204 ? undefined as T : await resposta.json() as T;
  }
  function limpar(): void {
    editando = null;
    form.reset();
    doc.querySelector('#titulo-form')!.textContent = 'Novo produto';
    salvar.textContent = 'Cadastrar produto';
    cancelar.hidden = true;
  }
  function bloquear(valor: boolean): void {
    ocupado = valor;
    doc.querySelectorAll<HTMLButtonElement>('button').forEach(botao => { botao.disabled = valor; });
  }
  async function carregar(): Promise<void> {
    const produtos = await api<Produto[]>('/produtos');
    lista.replaceChildren();
    doc.querySelector('#total')!.textContent = String(produtos.length);
    vazio.hidden = produtos.length > 0;
    vazio.textContent = 'Nenhum produto cadastrado. Comece pelo formulário.';
    for (const produto of produtos) {
      const linha = doc.createElement('tr');
      const celulaNome = doc.createElement('td');
      celulaNome.textContent = produto.nome;
      const celulaPreco = doc.createElement('td');
      celulaPreco.textContent = produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const acoes = doc.createElement('td');
      const editar = doc.createElement('button');
      editar.textContent = 'Editar';
      editar.className = 'secondary';
      editar.setAttribute('aria-label', `Editar ${produto.nome}`);
      editar.onclick = () => {
        editando = produto.id;
        nome.value = produto.nome;
        preco.value = String(produto.preco);
        doc.querySelector('#titulo-form')!.textContent = 'Editar produto';
        salvar.textContent = 'Salvar alterações';
        cancelar.hidden = false;
        nome.focus();
      };
      const excluir = doc.createElement('button');
      excluir.textContent = 'Excluir';
      excluir.className = 'danger';
      excluir.setAttribute('aria-label', `Excluir ${produto.nome}`);
      excluir.onclick = async () => {
        if (!confirmar(`Excluir o produto “${produto.nome}”?`)) return;
        bloquear(true);
        try {
          await api<void>(`/produtos/${produto.id}`, { method: 'DELETE' });
          if (editando === produto.id) limpar();
          avisar('Produto excluído.');
          await carregar();
        } catch (erro) { erroFalha(erro); } finally { bloquear(false); }
      };
      acoes.append(editar, excluir);
      linha.append(celulaNome, celulaPreco, acoes);
      lista.append(linha);
    }
  }
  form.onsubmit = async (evento) => {
    evento.preventDefault();
    if (ocupado || !form.reportValidity()) return;
    bloquear(true);
    try {
      const url = editando === null ? '/produtos' : `/produtos/${editando}`;
      await api<Produto>(url, {
        method: editando === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.value.trim(), preco: Number(preco.value) })
      });
      limpar();
      avisar('Produto salvo com sucesso.');
      await carregar();
    } catch (erro) { erroFalha(erro); } finally { bloquear(false); }
  };
  cancelar.onclick = limpar;
  doc.querySelector<HTMLButtonElement>('#recarregar')!.onclick = () => { void carregar().catch(erroFalha); };
  return carregar().catch((erro: unknown) => {
    vazio.textContent = 'Não foi possível carregar o catálogo. Tente atualizar a lista.';
    erroFalha(erro);
  });
}
