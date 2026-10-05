
const jwt = require('jsonwebtoken');

const JWT_SECRET = "sua_chave_secreta_para_testes";

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensagem: "Token de acesso não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ mensagem: "Token inválido ou expirado." });
    }
    req.usuario = usuario;
    next();
  });
}

function autorizarFuncoes(...funcoesPermitidas) {
  return (req, res, next) => {
    if (!funcoesPermitidas.includes(req.usuario.funcao)) {
      return res.status(403).json({ 
        mensagem: "Acesso negado: seu perfil não possui permissão para esta ação." 
      });
    }
    next();
  };
}

module.exports = {
  autenticarToken,
  autorizarFuncoes,
  JWT_SECRET
};