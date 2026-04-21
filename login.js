const API_URL = 'http://localhost:3000/api';

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.modal-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('authMsg').classList.add('hidden');
}

async function handleAuth(e, type) {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  
  const data = type === 'login' 
    ? { 
        email: document.getElementById('loginEmail').value, 
        password: document.getElementById('loginPass').value 
      }
    : { 
        name: document.getElementById('regName').value, 
        email: document.getElementById('regEmail').value, 
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPass').value 
      };

  try {
    const res = await fetch(`${API_URL}/auth/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    if (res.ok) {
      msg.textContent = `✅ ${result.message}`;
      msg.style.background = '#dcfce7';
      msg.style.color = '#166534';
      msg.classList.remove('hidden');
      
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);
    } else {
      msg.textContent = `❌ ${result.error}`;
      msg.style.background = '#fee2e2';
      msg.style.color = '#991b1b';
      msg.classList.remove('hidden');
    }
  } catch (err) {
    msg.textContent = '❌ Connection failed. Please try again.';
    msg.style.background = '#fee2e2';
    msg.style.color = '#991b1b';
    msg.classList.remove('hidden');
  }
}

// Check if already logged in
async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      window.location.href = 'home.html';
    }
  } catch (err) {
    console.log('Not authenticated');
  }
}

checkAuth();
