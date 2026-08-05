const passwordInput = document.getElementById('password');
const toggleButton = document.getElementById('toggle-password');
const eyeOpen = document.getElementById('eye-open');
const eyeClosed = document.getElementById('eye-closed');

toggleButton.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeClosed.classList.add('hidden');
    eyeOpen.classList.remove('hidden');
  } else {
    passwordInput.type = 'password';
    eyeOpen.classList.add('hidden');
    eyeClosed.classList.remove('hidden');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('reg-password');
  const toggleButton = document.getElementById('toggle-password');
  const eyeOpen = document.getElementById('eye-open');
  const eyeClosed = document.getElementById('eye-closed');

  if (!passwordInput || !toggleButton) return;

  toggleButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeClosed.classList.add('hidden');
      eyeOpen.classList.remove('hidden');
    } else {
      passwordInput.type = 'password';
      eyeOpen.classList.add('hidden');
      eyeClosed.classList.remove('hidden');
    }
  });
});