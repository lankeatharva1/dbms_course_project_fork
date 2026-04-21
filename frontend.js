const API_URL = 'http://localhost:3000/api';
let items = [];
let currentUser = null;

// ── Check Auth Status ─────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      currentUser = await res.json();
      document.querySelector('.btn-login').textContent = `👤 ${currentUser.user.name}`;
    }
  } catch (err) {
    console.log('Not authenticated');
  }
}

// ── Fetch Stats ───────────────────────────────────────────────
async function fetchStats() {
  try {
    const res = await fetch(`${API_URL}/stats`);
    const stats = await res.json();
    const statEls = document.querySelectorAll('.stat span');
    statEls[0].textContent = stats.total;
    statEls[1].textContent = stats.resolved;
    statEls[2].textContent = stats.pending;
  } catch (err) {
    console.error('Failed to fetch stats');
  }
}

// ── Fetch & Render Items ──────────────────────────────────────
async function fetchItems(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/items?${params}`);
    items = await res.json();
    renderItems(items);
  } catch (err) {
    console.error('Failed to fetch items');
  }
}

function renderItems(list) {
  const grid = document.getElementById('itemsGrid');
  if (!list.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1">No items found.</p>';
    return;
  }
  grid.innerHTML = list.map(item => `
    <div class="item-card ${item.item_type}">
      <span class="item-badge badge-${item.item_type}">${item.item_type}</span>
      <h3>${item.item_name}</h3>
      <p class="meta">📁 ${item.category}</p>
      <p class="meta">📍 ${item.location}</p>
      <p class="meta">📅 ${item.item_date}</p>
      <p class="meta" style="margin-top:.4rem;font-size:.83rem">${item.description || 'No description'}</p>
      <p class="item-id">ID: ${item.tracking_id} · <span class="status-badge status-${item.status}">${item.status}</span></p>
    </div>
  `).join('');
}

function filterItems() {
  const filters = {
    search: document.getElementById('searchInput').value,
    category: document.getElementById('filterCategory').value,
    type: document.getElementById('filterStatus').value,
  };
  fetchItems(filters);
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(type) {
  document.getElementById('reportType').value = type;
  document.querySelectorAll('.form-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && type === 'lost') || (i === 1 && type === 'found'));
  });
}

// ── Form Validation ───────────────────────────────────────────
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

// ── Submit Report ─────────────────────────────────────────────
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
      
      // Show matches if found
      if (result.matches && result.matches.length > 0) {
        displayMatches(result.matches);
      } else {
        document.getElementById('matchesSection').classList.add('hidden');
      }
      
      fetchItems();
      fetchStats();
      setTimeout(() => {
        document.getElementById('successMsg').classList.add('hidden');
        document.getElementById('matchesSection').classList.add('hidden');
      }, 10000);
    } else {
      alert(result.error || 'Failed to submit report');
    }
  } catch (err) {
    alert('Failed to submit report. Please try again.');
  }
}

// ── Display Matches ───────────────────────────────────────────
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

// ── Track Item ────────────────────────────────────────────────
async function trackItem() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  const result = document.getElementById('trackResult');

  try {
    const res = await fetch(`${API_URL}/items/track/${id}`);
    if (!res.ok) {
      result.innerHTML = '<p style="color:var(--lost);text-align:center">❌ No record found for this ID. Please check and try again.</p>';
      result.classList.remove('hidden');
      return;
    }

    const item = await res.json();
    result.innerHTML = `
      <h3>🔎 Item Found</h3>
      <div class="row"><span>Tracking ID</span><span>${item.tracking_id}</span></div>
      <div class="row"><span>Item Name</span><span>${item.item_name}</span></div>
      <div class="row"><span>Type</span><span>${item.item_type.toUpperCase()}</span></div>
      <div class="row"><span>Category</span><span>${item.category}</span></div>
      <div class="row"><span>Location</span><span>${item.location}</span></div>
      <div class="row"><span>Date</span><span>${item.item_date}</span></div>
      <div class="row"><span>Status</span><span><span class="status-badge status-${item.status}">${item.status}</span></span></div>
      <div class="row"><span>Contact</span><span>${item.contact_email}</span></div>
    `;
    result.classList.remove('hidden');
  } catch (err) {
    result.innerHTML = '<p style="color:var(--lost);text-align:center">❌ Failed to track item. Please try again.</p>';
    result.classList.remove('hidden');
  }
}

// ── Modal ─────────────────────────────────────────────────────
function toggleModal(id) {
  document.getElementById(id).classList.toggle('hidden');
  document.getElementById('modalOverlay').classList.toggle('hidden');
  document.getElementById('authMsg').classList.add('hidden');
}

function switchModalTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.modal-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
}

// ── Auth Handlers ─────────────────────────────────────────────
async function handleAuth(e, type) {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  
  const data = type === 'login' 
    ? { email: document.getElementById('loginEmail').value, password: document.getElementById('loginPass').value }
    : { name: document.getElementById('regName').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPass').value };

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
      msg.classList.remove('hidden');
      await checkAuth();
      setTimeout(() => toggleModal('loginModal'), 1500);
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

// ── Smooth Nav Active State ───────────────────────────────────
window.addEventListener('scroll', () => {
  const sections = ['home', 'report', 'browse', 'track'];
  const scrollY = window.scrollY + 80;
  sections.forEach(id => {
    const el = document.getElementById(id);
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (el && link) {
      const inView = scrollY >= el.offsetTop && scrollY < el.offsetTop + el.offsetHeight;
      link.classList.toggle('active', inView);
    }
  });
});

// ── Init ──────────────────────────────────────────────────────
checkAuth();
fetchItems();
fetchStats();
