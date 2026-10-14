const API_RECUPERACAO = 'http://localhost:3000/recuperacao';

async function chamarApi(rota, dados) {
  const resposta = await fetch(`${API_RECUPERACAO}/${rota}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(corpo.mensagem || 'Erro inesperado. Tente novamente.');
  }
  return corpo;
}

//esqueceu-sua-senha.html
async function solicitarCodigo() {
  const email = document.getElementById('recover-email').value.trim();

  try {
    await chamarApi('solicitar', { email });
    sessionStorage.setItem('emailRecuperacao', email);
    window.location.href = 'inserir-codigo.html';
  } catch (err) {
    alert(err.message);
  }
}

// inserir-codigo.html
async function verificarCodigo() {
  const codigo = document.getElementById('verification-code').value.trim();
  const email = sessionStorage.getItem('emailRecuperacao');

  if (!email) {
    window.location.href = 'esqueceu-sua-senha.html';
    return;
  }

  try {
    const { tokenRedefinicao } = await chamarApi('verificar', { email, codigo });
    sessionStorage.setItem('tokenRedefinicao', tokenRedefinicao);
    window.location.href = 'alterar-a-senha.html';
  } catch (err) {
    alert(err.message);
  }
}

//alterar-a-senha.html
async function redefinirSenha() {
  const novaSenha = document.getElementById('new-password').value;
  const confirmacao = document.getElementById('password').value;
  const tokenRedefinicao = sessionStorage.getItem('tokenRedefinicao');

  if (novaSenha !== confirmacao) {
    alert('As senhas não são iguais.');
    return;
  }

  if (!tokenRedefinicao) {
    window.location.href = 'esqueceu-sua-senha.html';
    return;
  }

  try {
    await chamarApi('redefinir', { tokenRedefinicao, novaSenha });
    sessionStorage.removeItem('emailRecuperacao');
    sessionStorage.removeItem('tokenRedefinicao');
    alert('Senha alterada com sucesso! Faça login com a nova senha.');
    window.location.href = 'tela-de-login.html';
  } catch (err) {
    alert(err.message);
  }
}