// ── Sample Data ──────────────────────────────────────────────
const sampleItems = [
  { id: 'LF-1001', type: 'lost', name: 'Blue Backpack', category: 'Clothing', location: 'Library Block A', date: '2025-06-10', desc: 'Navy blue Wildcraft backpack with laptop sleeve.', contact: 'rahul@example.com', status: 'pending' },
  { id: 'LF-1002', type: 'found', name: 'iPhone 13', category: 'Electronics', location: 'Cafeteria', date: '2025-06-11', desc: 'Black iPhone 13 with cracked screen protector.', contact: 'admin@portal.com', status: 'pending' },
  { id: 'LF-1003', type: 'lost', name: 'Student ID Card', category: 'Documents', location: 'Parking Lot', date: '2025-06-09', desc: 'ID card of Priya Sharma, Dept. of CS.', contact: 'priya@example.com', status: 'resolved' },
  { id: 'LF-1004', type: 'found', name: 'Car Keys', category: 'Keys', location: 'Gym Entrance', date: '2025-06-12', desc: 'Honda car keys with a red keychain.', contact: 'admin@portal.com', status: 'pending' },
  { id: 'LF-1005', type: 'lost', name: 'Wired Earphones', category: 'Electronics', location: 'Lecture Hall 3', date: '2025-06-08', desc: 'White Sony earphones in a black pouch.', contact: 'amit@example.com', status: 'pending' },
  { id: 'LF-1006', type: 'found', name: 'Leather Wallet', category: 'Accessories', location: 'Canteen', date: '2025-06-13', desc: 'Brown leather wallet with some cash and cards.', contact: 'admin@portal.com', status: 'resolved' },
];

let items = [...sampleItems];
let idCounter = 1007;

// ── Render Items ──────────────────────────────────────────────
function renderItems(list) {
  const grid = document.getElementById('itemsGrid');
  if (!list.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1">No items found.</p>';
    return;
  }
  grid.innerHTML = list.map(item => `
    <div class="item-card ${item.type}">
      <span class="item-badge badge-${item.type}">${item.type}</span>
      <h3>${item.name}</h3>
      <p class="meta">📁 ${item.category}</p>
      <p class="meta">📍 ${item.location}</p>
      <p class="meta">📅 ${item.date}</p>
      <p class="meta" style="margin-top:.4rem;font-size:.83rem">${item.desc}</p>
      <p class="item-id">ID: ${item.id} · <span class="status-badge status-${item.status}">${item.status}</span></p>
    </div>
  `).join('');
}

function filterItems() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('filterCategory').value;
  const status = document.getElementById('filterStatus').value;
  const filtered = items.filter(i =>
    (!q || i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)) &&
    (!cat || i.category === cat) &&
    (!status || i.type === status)
  );
  renderItems(filtered);
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(type) {
  document.getElementById('reportType').value = type;
  document.querySelectorAll('.form-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && type === 'lost') || (i === 1 && type === 'found'));
  });
}

// ── Form Validation & Submit ──────────────────────────────────
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

function submitReport(e) {
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

  const newItem = {
    id: `LF-${idCounter++}`,
    type: document.getElementById('reportType').value,
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('category').value,
    location: document.getElementById('location').value.trim(),
    date: document.getElementById('itemDate').value,
    desc: document.getElementById('description').value.trim() || 'No description provided.',
    contact: document.getElementById('userEmail').value.trim(),
    status: 'pending',
  };

  items.unshift(newItem);
  renderItems(items);

  document.getElementById('trackingId').textContent = newItem.id;
  document.getElementById('successMsg').classList.remove('hidden');
  document.getElementById('reportForm').reset();
  setTimeout(() => document.getElementById('successMsg').classList.add('hidden'), 6000);
}

// ── Track Item ────────────────────────────────────────────────
function trackItem() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  const result = document.getElementById('trackResult');
  const item = items.find(i => i.id === id);

  if (!item) {
    result.innerHTML = '<p style="color:var(--lost);text-align:center">❌ No record found for this ID. Please check and try again.</p>';
    result.classList.remove('hidden');
    return;
  }

  result.innerHTML = `
    <h3>🔎 Item Found</h3>
    <div class="row"><span>Tracking ID</span><span>${item.id}</span></div>
    <div class="row"><span>Item Name</span><span>${item.name}</span></div>
    <div class="row"><span>Type</span><span>${item.type.toUpperCase()}</span></div>
    <div class="row"><span>Category</span><span>${item.category}</span></div>
    <div class="row"><span>Location</span><span>${item.location}</span></div>
    <div class="row"><span>Date</span><span>${item.date}</span></div>
    <div class="row"><span>Status</span><span><span class="status-badge status-${item.status}">${item.status}</span></span></div>
    <div class="row"><span>Contact</span><span>${item.contact}</span></div>
  `;
  result.classList.remove('hidden');
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

function handleAuth(e, type) {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  msg.textContent = type === 'login' ? '✅ Logged in successfully!' : '✅ Registered successfully!';
  msg.classList.remove('hidden');
  setTimeout(() => toggleModal('loginModal'), 1500);
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
renderItems(items);
