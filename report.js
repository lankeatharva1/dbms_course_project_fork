const API_URL = 'http://localhost:3000/api';

// Check auth
async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      document.querySelector('.btn-login').textContent = `👤 ${data.user.name}`;
      document.querySelector('.btn-login').onclick = () => window.location.href = 'profile.html';
    }
  } catch (err) {
    console.log('Not authenticated');
  }
}

function switchTab(type) {
  document.getElementById('reportType').value = type;
  document.querySelectorAll('.form-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && type === 'lost') || (i === 1 && type === 'found'));
  });
}

function validate(id, errId, msg) {
  const val = document.getElementById(id).value.trim();
  const err = document.getElementById(errId);
  if (!val) { err.textContent = msg; return false; }
  err.textContent = '';
  return true;
}

function validateEmail(id, errId) {
  const val = document.getElementById(id).value.trim();
  const err = document.getElementById(errId);
  if (!val) { err.textContent = 'Email is required.'; return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { err.textContent = 'Enter a valid email.'; return false; }
  err.textContent = '';
  return true;
}

async function submitReport(e) {
  e.preventDefault();
  const ok = [
    validate('itemName', 'itemNameErr', 'Item name is required.'),
    validate('category', 'categoryErr', 'Please select a category.'),
    validate('location', 'locationErr', 'Location is required.'),
    validate('itemDate', 'dateErr', 'Date is required.'),
    validate('userName', 'userNameErr', 'Your name is required.'),
    validateEmail('userEmail', 'emailErr'),
  ].every(Boolean);

  if (!ok) return;

  const data = {
    type: document.getElementById('reportType').value,
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('category').value,
    location: document.getElementById('location').value.trim(),
    date: document.getElementById('itemDate').value,
    description: document.getElementById('description').value.trim(),
    contactEmail: document.getElementById('userEmail').value.trim(),
    userName: document.getElementById('userName').value.trim(),
  };

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    if (res.ok) {
      document.getElementById('trackingId').textContent = result.trackingId;
      document.getElementById('successMsg').classList.remove('hidden');
      document.getElementById('reportForm').reset();
      
      if (result.matches && result.matches.length > 0) {
        displayMatches(result.matches);
      } else {
        document.getElementById('matchesSection').classList.add('hidden');
      }
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } else {
      alert(result.error || 'Failed to submit report');
    }
  } catch (err) {
    alert('Failed to submit report. Please try again.');
  }
}

function displayMatches(matches) {
  const grid = document.getElementById('matchesGrid');
  grid.innerHTML = matches.map(item => {
    const matchLabels = [];
    if (item.match_score >= 3) matchLabels.push('Same Category');
    if (item.match_score >= 5) matchLabels.push('Similar Location');
    if (item.match_score >= 6) matchLabels.push('Recent Date');
    
    return `
      <div class="match-card">
        <div class="match-info">
          <h4>${item.item_name}</h4>
          <p class="meta">📁 ${item.category} · 📍 ${item.location}</p>
          <p class="meta">📅 ${item.item_date} · ID: ${item.tracking_id}</p>
          <p class="meta">✉️ ${item.contact_email}</p>
        </div>
        <div class="match-score">${matchLabels.join(' + ') || 'Match'}</div>
      </div>
    `;
  }).join('');
  document.getElementById('matchesSection').classList.remove('hidden');
}

checkAuth();
