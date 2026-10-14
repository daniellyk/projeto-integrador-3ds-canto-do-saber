const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'pratestarim@gmail.com',
    pass: 'wnmt rsgo zpgc chde'
  }
});

transport.sendMail({
  from: 'Canto do saber',
  to: 'pratestarim@gmail.com',
  subject: 'Enviando email com Nodemailer',
  html: '<h1>Olá, Dev!</h1> <p>Esse email foi enviado usando o Nodemailer</p>',
  text: 'Olá, Dev! Esse email foi enviado usando o Nodemailer',
})
.then(() => console.log('Email enviado com sucesso!'))
.catch((err) => console.log('Erro ao enviar email: ', err));