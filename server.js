const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Auth Middleware ──────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// ── API Routes ───────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );
    
    req.session.userId = result.insertId;
    req.session.userName = name;
    req.session.userEmail = email;
    
    res.json({ success: true, message: 'Registered successfully', user: { name, email } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    req.session.userId = user.user_id;
    req.session.userName = user.full_name;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    
    res.json({ success: true, message: 'Logged in successfully', user: { name: user.full_name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: { name: req.session.userName, email: req.session.userEmail, role: req.session.userRole } });
});

// Get all items (with filters)
app.get('/api/items', async (req, res) => {
  try {
    const { search, category, type, status } = req.query;
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (item_name LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      query += ' AND item_type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    const [items] = await db.query(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get item by tracking ID
app.get('/api/items/track/:trackingId', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM items WHERE tracking_id = ?', [req.params.trackingId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    res.json(items[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Find matching items
app.get('/api/items/matches/:itemId', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM items WHERE item_id = ?', [req.params.itemId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    
    const item = items[0];
    const oppositeType = item.item_type === 'lost' ? 'found' : 'lost';
    
    // Find potential matches: opposite type, same category, similar location/date
    const [matches] = await db.query(
      `SELECT *, 
        (CASE WHEN category = ? THEN 3 ELSE 0 END +
         CASE WHEN location LIKE ? THEN 2 ELSE 0 END +
         CASE WHEN ABS(DATEDIFF(item_date, ?)) <= 7 THEN 1 ELSE 0 END) as match_score
       FROM items 
       WHERE item_type = ? AND status = 'pending' AND item_id != ?
       HAVING match_score > 0
       ORDER BY match_score DESC, created_at DESC
       LIMIT 10`,
      [item.category, `%${item.location}%`, item.item_date, oppositeType, item.item_id]
    );
    
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

// Create item report with matching
app.post('/api/items', async (req, res) => {
  try {
    const { type, name, category, location, date, description, contactEmail, userName } = req.body;
    if (!type || !name || !category || !location || !date || !contactEmail || !userName) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Generate tracking ID
    const [lastItem] = await db.query('SELECT tracking_id FROM items ORDER BY item_id DESC LIMIT 1');
    let nextId = 1001;
    if (lastItem.length) {
      const lastNum = parseInt(lastItem[0].tracking_id.split('-')[1]);
      nextId = lastNum + 1;
    }
    const trackingId = `LF-${nextId}`;
    
    const [result] = await db.query(
      'INSERT INTO items (tracking_id, user_id, item_type, item_name, category, location, item_date, description, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [trackingId, req.session.userId || null, type, name, category, location, date, description || '', contactEmail]
    );
    
    // Find potential matches
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const [matches] = await db.query(
      `SELECT *, 
        (CASE WHEN category = ? THEN 3 ELSE 0 END +
         CASE WHEN location LIKE ? THEN 2 ELSE 0 END +
         CASE WHEN ABS(DATEDIFF(item_date, ?)) <= 7 THEN 1 ELSE 0 END) as match_score
       FROM items 
       WHERE item_type = ? AND status = 'pending' AND item_id != ?
       HAVING match_score > 0
       ORDER BY match_score DESC, created_at DESC
       LIMIT 5`,
      [category, `%${location}%`, date, oppositeType, result.insertId]
    );
    
    res.json({ success: true, trackingId, itemId: result.insertId, matches });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item report' });
  }
});

// Update item status (admin only)
app.patch('/api/items/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    const { status } = req.body;
    if (!['pending', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.query('UPDATE items SET status = ? WHERE item_id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as count FROM items');
    const [resolved] = await db.query('SELECT COUNT(*) as count FROM items WHERE status = "resolved"');
    const [pending] = await db.query('SELECT COUNT(*) as count FROM items WHERE status = "pending"');
    
    res.json({
      total: total[0].count,
      resolved: resolved[0].count,
      pending: pending[0].count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔍 Matching system enabled`);
});
