

const usuarios = [
  {
    id: "usr_1",
    nome: "Danielly Silva",
    email: "danielly@escola.com",
    senhaHash: "$2a$10$4.a5dM7iN7O4Wz.q6J3D3u9hV21gEa.9sK.9xGvH90.", // Senha: "123456"
    funcao: "ALUNO",
    turma: "3º Ano A",
    dataIngresso: "2024-02-01"
  },
  {
    id: "usr_2",
    nome: "Laura Costa",
    email: "laura@escola.com",
    senhaHash: "$2a$10$4.a5dM7iN7O4Wz.q6J3D3u9hV21gEa.9sK.9xGvH90.", // Senha: "123456"
    funcao: "ALUNO",
    turma: "3º Ano A",
    dataIngresso: "2024-02-01"
  },
  {
    id: "usr_3",
    nome: "Prof. Marcos",
    email: "marcos@escola.com",
    senhaHash: "$2a$10$4.a5dM7iN7O4Wz.q6J3D3u9hV21gEa.9sK.9xGvH90.", // Senha: "123456"
    funcao: "COORDENADOR",
    turma: "Coordenação Pedagógica",
    dataIngresso: "2020-01-15"
  }
];

const avisos = [
  {
    id: "avs_1",
    titulo: "Simulado de Matemática no Sábado",
    conteudo: "Lembrando que o simulado presencial ocorrerá às 08h. Cheguem com antecedência.",
    autorId: "usr_3",
    dataCriacao: "2026-03-20T10:00:00Z"
  }
];

const categorias = [
  { id: "cat_1", nome: "Matemática", descricao: "Álgebra, Geometria e Trigonometria" },
  { id: "cat_2", nome: "Português", descricao: "Gramática, Redação e Literatura" },
  { id: "cat_3", nome: "Física", descricao: "Mecânica, Termodinâmica e Óptica" }
];

const topicos = [
  {
    id: "top_1",
    titulo: "Como resolver equação do 2º grau por Bhaskara?",
    descricao: "Alguém pode me explicar o passo a passo de como calcular o Delta?",
    categoriaId: "cat_1",
    autorId: "usr_1",
    turma: "3º Ano A",
    status: "APROVADO", // PENDENTE, APROVADO, RECUSADO
    motivoRecusa: null,
    imagemUrl: null,
    dataCriacao: "2026-03-25T14:30:00Z"
  },
  {
    id: "top_2",
    titulo: "Dúvida sobre crase antes de pronomes",
    descricao: "Quando devo usar crase antes de 'esta' ou 'sua'?",
    categoriaId: "cat_2",
    autorId: "usr_2",
    turma: "3º Ano A",
    status: "PENDENTE",
    motivoRecusa: null,
    imagemUrl: null,
    dataCriacao: "2026-03-28T09:00:00Z"
  }
];

const posts = [
  {
    id: "pst_1",
    topicoId: "top_1",
    autorId: "usr_2",
    conteudo: "Primeiro você calcula o Delta: Δ = b² - 4ac. Se o Delta for negativo, não há raízes reais!",
    anexoUrl: null,
    dataCriacao: "2026-03-25T15:00:00Z"
  }
];

const notificacoes = [
  {
    id: "not_1",
    usuarioId: "usr_1",
    mensagem: "Seu tópico 'Como resolver equação do 2º grau por Bhaskara?' foi APROVADO.",
    lida: false,
    dataCriacao: "2026-03-25T14:35:00Z"
  }
];

module.exports = {
  usuarios,
  avisos,
  categorias,
  topicos,
  posts,
  notificacoes
};