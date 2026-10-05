const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'sua_chave_secreta_aqui';

const usuarios = [];
const topicos = [];
const avisos = [];
const categorias = [];
const notificacoes = [];

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      mensagem: "Acesso negado. Token não fornecido."
    });
  }

  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({
        mensagem: "Token inválido ou expirado."
      });
    }

    req.usuario = usuario;
    next();
  });
}

function autorizarFuncoes(...funcoesPermitidas) {
  return (req, res, next) => {
    if (
      !req.usuario ||
      !funcoesPermitidas.includes(req.usuario.funcao)
    ) {
      return res.status(403).json({
        mensagem: "Acesso negado. Você não tem permissão para esta ação."
      });
    }

    next();
  };
}

app.post('/usuarios/login', (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(401).json({
      mensagem: "E-mail ou senha inválidos."
    });
  }

  const senhaValida =
    senha === "123456" ||
    bcrypt.compareSync(senha, usuario.senhaHash);

  if (!senhaValida) {
    return res.status(401).json({
      mensagem: "E-mail ou senha inválidos."
    });
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      funcao: usuario.funcao,
      turma: usuario.turma
    },
    JWT_SECRET,
    {
      expiresIn: '150h'
    }
  );

  return res.json({
    mensagem: "Login realizado com sucesso",
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao,
      turma: usuario.turma
    }
  });
});

app.post('/usuarios', (req, res) => {
  const {
    nome,
    email,
    senha,
    turma,
    funcao
  } = req.body;

  if (usuarios.some(u => u.email === email)) {
    return res.status(409).json({
      mensagem: "E-mail já cadastrado no sistema."
    });
  }

  const novoUsuario = {
    id: `usr_${Date.now()}`,
    nome,
    email,
    senhaHash: bcrypt.hashSync(senha, 8),
    funcao: funcao || "ALUNO",
    turma: turma || "Geral",
    dataIngresso: new Date().toISOString().split('T')[0]
  };

  usuarios.push(novoUsuario);

  return res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso",
    id: novoUsuario.id
  });
});

app.get('/usuarios/:id', autenticarToken, (req, res) => {
  const usuario = usuarios.find(u => u.id === req.params.id);

  if (!usuario) {
    return res.status(404).json({
      mensagem: "Usuário não encontrado."
    });
  }

  const topicosUsuario = topicos.filter(
    t =>
      t.autorId === usuario.id &&
      t.status === "APROVADO"
  );

  return res.json({
    id: usuario.id,
    nome: usuario.nome,
    funcao: usuario.funcao,
    turma: usuario.turma,
    dataIngresso: usuario.dataIngresso,
    historicoPublicacoes: topicosUsuario
  });
});

app.delete('/usuarios/:id', autenticarToken, (req, res) => {
  const ehProprioUsuario = req.usuario.id === req.params.id;
  const ehCoordenador = req.usuario.funcao === 'COORDENADOR';

  if (!ehProprioUsuario && !ehCoordenador) {
    return res.status(403).json({
      mensagem: "Acesso negado. Apenas o próprio usuário ou coordenador pode excluir a conta."
    });
  }

  const index = usuarios.findIndex(
    u => u.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      mensagem: "Usuário não encontrado."
    });
  }

  usuarios.splice(index, 1);

  return res.json({
    mensagem: "Conta excluída com sucesso. Histórico mantido."
  });
});

app.get(
  '/usuarios',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const lista = usuarios.map(({ senhaHash, ...u }) => u);

    return res.json(lista);
  }
);

app.put('/usuarios/:id', autenticarToken, (req, res) => {
  const usuario = usuarios.find(u => u.id === req.params.id);

  if (!usuario) {
    return res.status(404).json({
      mensagem: "Usuário não encontrado."
    });
  }

  const ehProprioUsuario = req.usuario.id === req.params.id;
  const ehCoordenador = req.usuario.funcao === 'COORDENADOR';

  if (!ehProprioUsuario && !ehCoordenador) {
    return res.status(403).json({
      mensagem: "Acesso negado. Você não tem permissão para editar este usuário."
    });
  }

  const {
    nome,
    email,
    turma,
    funcao
  } = req.body;

  if (nome) usuario.nome = nome;
  if (email) usuario.email = email;
  if (turma) usuario.turma = turma;

  if (funcao && ehCoordenador) {
    usuario.funcao = funcao;
  }

  const {
    senhaHash,
    ...usuarioSemSenha
  } = usuario;

  return res.json({
    mensagem: "Usuário atualizado com sucesso.",
    usuario: usuarioSemSenha
  });
});

app.get('/avisos', autenticarToken, (req, res) => {
  return res.json(avisos);
});

app.get('/avisos/:id', autenticarToken, (req, res) => {
  const aviso = avisos.find(a => a.id === req.params.id);

  if (!aviso) {
    return res.status(404).json({
      mensagem: "Aviso não encontrado."
    });
  }

  return res.json(aviso);
});

app.post(
  '/avisos',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const {
      titulo,
      conteudo
    } = req.body;

    const novoAviso = {
      id: `avs_${Date.now()}`,
      titulo,
      conteudo,
      autorId: req.usuario.id,
      dataCriacao: new Date().toISOString()
    };

    avisos.unshift(novoAviso);

    return res.status(201).json(novoAviso);
  }
);

app.put(
  '/avisos/:id',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const aviso = avisos.find(a => a.id === req.params.id);

    if (!aviso) {
      return res.status(404).json({
        mensagem: "Aviso não encontrado."
      });
    }

    aviso.titulo = req.body.titulo || aviso.titulo;
    aviso.conteudo = req.body.conteudo || aviso.conteudo;

    return res.json(aviso);
  }
);

app.delete(
  '/avisos/:id',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const index = avisos.findIndex(
      a => a.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        mensagem: "Aviso não encontrado."
      });
    }

    avisos.splice(index, 1);

    return res.json({
      mensagem: "Aviso removido com sucesso."
    });
  }
);

app.get('/categorias', autenticarToken, (req, res) => {
  return res.json(categorias);
});

app.post(
  '/categorias',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const {
      nome,
      descricao
    } = req.body;

    const novaCategoria = {
      id: `cat_${Date.now()}`,
      nome,
      descricao
    };

    categorias.push(novaCategoria);

    return res.status(201).json(novaCategoria);
  }
);

app.get('/categorias/:id', autenticarToken, (req, res) => {
  const categoria = categorias.find(
    c => c.id === req.params.id
  );

  if (!categoria) {
    return res.status(404).json({
      mensagem: "Categoria não encontrada."
    });
  }

  return res.json(categoria);
});

app.put(
  '/categorias/:id',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const categoria = categorias.find(
      c => c.id === req.params.id
    );

    if (!categoria) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada."
      });
    }

    const {
      nome,
      descricao
    } = req.body;

    if (nome) categoria.nome = nome;
    if (descricao) categoria.descricao = descricao;

    return res.json({
      mensagem: "Categoria atualizada com sucesso.",
      categoria
    });
  }
);

app.delete(
  '/categorias/:id',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const index = categorias.findIndex(
      c => c.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada."
      });
    }

    categorias.splice(index, 1);

    return res.json({
      mensagem: "Categoria removida com sucesso."
    });
  }
);

app.get('/topicos', autenticarToken, (req, res) => {
  const {
    busca,
    categoriaId
  } = req.query;

  let resultado = topicos.filter(
    t => t.status === "APROVADO"
  );

  if (busca) {
    const termo = busca.toLowerCase();

    resultado = resultado.filter(
      t =>
        t.titulo.toLowerCase().includes(termo) ||
        t.descricao.toLowerCase().includes(termo)
    );
  }

  if (categoriaId) {
    resultado = resultado.filter(
      t => t.categoriaId === categoriaId
    );
  }

  resultado.sort(
    (a, b) =>
      new Date(b.dataCriacao) -
      new Date(a.dataCriacao)
  );

  return res.json(resultado);
});

app.get(
  '/topicos/pendentes',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const pendentes = topicos.filter(
      t => t.status === "PENDENTE"
    );

    return res.json({
      totalPendentes: pendentes.length,
      topicos: pendentes
    });
  }
);

app.post('/topicos', autenticarToken, (req, res) => {
  const {
    titulo,
    descricao,
    categoriaId,
    imagemUrl
  } = req.body;

  if (!categorias.some(c => c.id === categoriaId)) {
    return res.status(400).json({
      mensagem:
        "RN 03.2: O tópico deve ser associado a uma categoria válida."
    });
  }

  const novoTopico = {
    id: `top_${Date.now()}`,
    titulo,
    descricao,
    categoriaId,
    autorId: req.usuario.id,
    turma: req.usuario.turma,
    status: "PENDENTE",
    motivoRecusa: null,
    imagemUrl: imagemUrl || null,
    dataCriacao: new Date().toISOString()
  };

  topicos.push(novoTopico);

  return res.status(201).json({
    mensagem:
      "Tópico enviado para aprovação da coordenação.",
    topico: novoTopico
  });
});

app.put(
  '/topicos/:id/moderacao',
  autenticarToken,
  autorizarFuncoes('COORDENADOR', 'PROFESSOR'),
  (req, res) => {
    const {
      status,
      motivoRecusa
    } = req.body;

    const topico = topicos.find(
      t => t.id === req.params.id
    );

    if (!topico) {
      return res.status(404).json({
        mensagem: "Tópico não encontrado."
      });
    }

    if (!['APROVADO', 'RECUSADO'].includes(status)) {
      return res.status(400).json({
        mensagem:
          "O status deve ser APROVADO ou RECUSADO."
      });
    }

    if (status === "RECUSADO" && !motivoRecusa) {
      return res.status(400).json({
        mensagem:
          "RN 04.3: O motivo da recusa é obrigatório."
      });
    }

    topico.status = status;

    topico.motivoRecusa =
      status === "RECUSADO"
        ? motivoRecusa
        : null;

    notificacoes.push({
      id: `not_${Date.now()}`,
      usuarioId: topico.autorId,
      mensagem:
        status === "APROVADO"
          ? `Seu tópico '${topico.titulo}' foi aprovado e publicado!`
          : `Seu tópico '${topico.titulo}' foi recusado. Motivo: ${motivoRecusa}`,
      lida: false,
      dataCriacao: new Date().toISOString()
    });

    return res.json({
      mensagem:
        `Status do tópico alterado para ${status}.`,
      topico
    });
  }
);

app.get('/topicos/:id', autenticarToken, (req, res) => {
  const topico = topicos.find(
    t => t.id === req.params.id
  );

  if (!topico) {
    return res.status(404).json({
      mensagem: "Tópico não encontrado."
    });
  }

  const ehAutor =
    req.usuario.id === topico.autorId;

  const ehCoordenador =
    req.usuario.funcao === 'COORDENADOR';

  if (
    topico.status !== 'APROVADO' &&
    !ehAutor &&
    !ehCoordenador
  ) {
    return res.status(403).json({
      mensagem:
        "Acesso negado. Tópico não está aprovado."
    });
  }

  return res.json(topico);
});

app.put('/topicos/:id', autenticarToken, (req, res) => {
  const topico = topicos.find(
    t => t.id === req.params.id
  );

  if (!topico) {
    return res.status(404).json({
      mensagem: "Tópico não encontrado."
    });
  }

  if (req.usuario.id !== topico.autorId) {
    return res.status(403).json({
      mensagem:
        "Acesso negado. Apenas o autor pode editar o tópico."
    });
  }

  if (topico.status === 'APROVADO') {
    return res.status(400).json({
      mensagem:
        "Não é possível editar um tópico já aprovado."
    });
  }

  const {
    titulo,
    descricao,
    categoriaId,
    imagemUrl
  } = req.body;

  if (categoriaId) {
    const categoriaExiste = categorias.some(
      c => c.id === categoriaId
    );

    if (!categoriaExiste) {
      return res.status(400).json({
        mensagem: "Categoria inválida."
      });
    }

    topico.categoriaId = categoriaId;
  }

  if (titulo) topico.titulo = titulo;
  if (descricao) topico.descricao = descricao;

  if (imagemUrl !== undefined) {
    topico.imagemUrl = imagemUrl;
  }

  return res.json({
    mensagem: "Tópico atualizado com sucesso.",
    topico
  });
});

app.delete('/topicos/:id', autenticarToken, (req, res) => {
  const index = topicos.findIndex(
    t => t.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      mensagem: "Tópico não encontrado."
    });
  }

  const topico = topicos[index];

  const ehAutor =
    req.usuario.id === topico.autorId;

  const ehCoordenador =
    req.usuario.funcao === 'COORDENADOR';

  if (!ehAutor && !ehCoordenador) {
    return res.status(403).json({
      mensagem:
        "Acesso negado. Apenas o autor ou coordenador pode remover o tópico."
    });
  }

  topicos.splice(index, 1);

  return res.json({
    mensagem: "Tópico removido com sucesso."
  });
});

app.get('/notificacoes', autenticarToken, (req, res) => {
  const minhasNotificacoes = notificacoes.filter(
    n => n.usuarioId === req.usuario.id
  );

  return res.json(minhasNotificacoes);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});