const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarCodigoRecuperacao } = require('./mailer');

const VALIDADE_CODIGO_MS = 10 * 60 * 1000; // 10 minutos
const INTERVALO_REENVIO_MS = 60 * 1000;    // 1 minuto entre pedidos
const MAX_TENTATIVAS = 5;

module.exports = function criarRotasRecuperacao(usuarios, JWT_SECRET) {
  const router = express.Router();

  // Segredo diferente do login: o token de redefinição não serve como token de acesso
  const SEGREDO_REDEFINICAO = `${JWT_SECRET}:redefinir-senha`;

  const codigos = new Map();      // email -> { hash, expira, tentativas, criadoEm }
  const tokensUsados = new Set(); // evita usar o mesmo token duas vezes

  const normalizar = (email) => String(email || '').trim().toLowerCase();

  // 1) Usuário informou o e-mail: gera o código e envia
  router.post('/solicitar', async (req, res) => {
    const email = normalizar(req.body.email);

    // Mesma resposta exista o e-mail ou não, para não revelar quem tem conta
    const resposta = {
      mensagem: 'Se o e-mail estiver cadastrado, enviamos um código de verificação.',
    };

    const usuario = usuarios.find((u) => normalizar(u.email) === email);
    if (!usuario) return res.json(resposta);

    const anterior = codigos.get(email);
    if (anterior && Date.now() - anterior.criadoEm < INTERVALO_REENVIO_MS) {
      return res.json(resposta);
    }

    const codigo = crypto.randomInt(100000, 1000000).toString(); // 6 dígitos
    codigos.set(email, {
      hash: bcrypt.hashSync(codigo, 8), // o código não fica guardado em texto puro
      expira: Date.now() + VALIDADE_CODIGO_MS,
      tentativas: 0,
      criadoEm: Date.now(),
    });

    try {
      await enviarCodigoRecuperacao(usuario.email, usuario.nome, codigo);
    } catch (err) {
      console.log('Erro ao enviar email: ', err);
      codigos.delete(email);
    }

    return res.json(resposta);
  });

  // 2) Usuário digitou o código: confere e devolve um token para trocar a senha
  router.post('/verificar', (req, res) => {
    const email = normalizar(req.body.email);
    const codigo = String(req.body.codigo || '').trim();
    const registro = codigos.get(email);

    if (!registro || registro.expira < Date.now()) {
      codigos.delete(email);
      return res.status(400).json({ mensagem: 'Código inválido ou expirado.' });
    }

    registro.tentativas++;
    if (registro.tentativas > MAX_TENTATIVAS) {
      codigos.delete(email);
      return res.status(429).json({ mensagem: 'Muitas tentativas. Solicite um novo código.' });
    }

    if (!bcrypt.compareSync(codigo, registro.hash)) {
      return res.status(400).json({ mensagem: 'Código inválido ou expirado.' });
    }

    codigos.delete(email); // o código só funciona uma vez

    const usuario = usuarios.find((u) => normalizar(u.email) === email);
    if (!usuario) {
      return res.status(400).json({ mensagem: 'Código inválido ou expirado.' });
    }

    const tokenRedefinicao = jwt.sign(
      { id: usuario.id, jti: crypto.randomUUID() },
      SEGREDO_REDEFINICAO,
      { expiresIn: '10m' }
    );

    return res.json({ mensagem: 'Código verificado.', tokenRedefinicao });
  });

  // 3) Usuário escolheu a nova senha
  router.post('/redefinir', (req, res) => {
    const { tokenRedefinicao, novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ mensagem: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    jwt.verify(tokenRedefinicao || '', SEGREDO_REDEFINICAO, (err, dados) => {
      if (err || tokensUsados.has(dados.jti)) {
        return res.status(403).json({ mensagem: 'Sessão de recuperação inválida ou expirada.' });
      }

      const usuario = usuarios.find((u) => u.id === dados.id);
      if (!usuario) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
      }

      usuario.senhaHash = bcrypt.hashSync(novaSenha, 8);
      tokensUsados.add(dados.jti);

      return res.json({ mensagem: 'Senha alterada com sucesso.' });
    });
  });

  return router;
};