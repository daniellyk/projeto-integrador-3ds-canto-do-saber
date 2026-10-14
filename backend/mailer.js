const path = require('path');
const nodemailer = require('nodemailer');

// Lê o arquivo backend/.env (Node 20.12+ já faz isso sem instalar nada)
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  console.log('Arquivo backend/.env não encontrado. Crie um a partir do .env.example.');
}

const transport = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function enviarCodigoRecuperacao(destinatario, nome, codigo) {
  return transport.sendMail({
    from: `Canto do Saber <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Canto do Saber - Código para redefinir sua senha',
    html: `
      <h2>Olá, ${escapar(nome)}!</h2>
      <p>Recebemos um pedido para redefinir a senha da sua conta no Canto do Saber.</p>
      <p>Seu código de verificação é:</p>
      <h1 style="letter-spacing: 4px;">${codigo}</h1>
      <p>Ele vale por 10 minutos. Se não foi você, ignore este e-mail.</p>
    `,
    text: `Olá, ${nome}! Seu código de verificação do Canto do Saber é: ${codigo}. Ele vale por 10 minutos.`,
  });
}

module.exports = { enviarCodigoRecuperacao };