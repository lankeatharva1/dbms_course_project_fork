const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Redirect root to home page
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// ── Auth Middleware ──────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// ── API Routes ───────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (user_name, email, password_hash, phone_no) VALUES (?, ?, ?, ?)',
      [name, email, hash, phone || '0000000000']
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
    req.session.userName = user.user_name;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    
    res.json({ success: true, message: 'Logged in successfully', user: { name: user.user_name, email: user.email, role: user.role } });
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

// Get all items (with filters) - Using VIEW
app.get('/api/items', async (req, res) => {
  try {
    const { search, category, type, status } = req.query;
    let query = 'SELECT * FROM v_item_details WHERE 1=1';
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
      query += ' AND status = ?';
      params.push(type);
    }
    if (status === 'pending') {
      query += ' AND complaint_status = "open"';
    } else if (status === 'resolved') {
      query += ' AND complaint_status = "closed"';
    }
    
    query += ' ORDER BY item_date DESC';
    const [items] = await db.query(query, params);
    
    // Format for frontend compatibility
    const formatted = items.map(item => ({
      item_id: item.item_id,
      tracking_id: item.tracking_id,
      item_type: item.status,
      item_name: item.item_name,
      category: item.category,
      location: item.location,
      item_date: item.item_date,
      description: item.description,
      contact_email: item.contact_email,
      status: item.complaint_status === 'open' ? 'pending' : 'resolved'
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get item by tracking ID
app.get('/api/items/track/:trackingId', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM v_item_details WHERE tracking_id = ?', [req.params.trackingId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    
    const item = items[0];
    const formatted = {
      item_id: item.item_id,
      tracking_id: item.tracking_id,
      item_name: item.item_name,
      item_type: item.status,
      category: item.category,
      location: item.location,
      item_date: item.item_date,
      status: item.complaint_status === 'open' ? 'pending' : 'resolved',
      contact_email: item.contact_email,
      contact_name: item.user_name,
      description: item.description
    };
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Find matching items using stored procedure
app.get('/api/items/matches/:itemId', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM v_item_details WHERE item_id = ?', [req.params.itemId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    
    const item = items[0];
    
    // Call stored procedure
    const [matches] = await db.query(
      'CALL find_matches(?, ?, ?, ?, ?)',
      [item.item_id, item.category, item.location, item.item_date, item.status]
    );
    
    res.json(matches[0] || []);
  } catch (err) {
    console.error(err);
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
    
    // Get item_type_id
    const [itemTypes] = await db.query('SELECT item_type_id FROM item_type WHERE item_description = ?', [category]);
    let itemTypeId;
    if (itemTypes.length) {
      itemTypeId = itemTypes[0].item_type_id;
    } else {
      // Create new item type if doesn't exist
      const [result] = await db.query('INSERT INTO item_type (item_description) VALUES (?)', [category]);
      itemTypeId = result.insertId;
    }
    
    // Generate tracking ID
    const [lastItem] = await db.query('SELECT tracking_id FROM item ORDER BY item_id DESC LIMIT 1');
    let nextId = 1001;
    if (lastItem.length && lastItem[0].tracking_id) {
      const lastNum = parseInt(lastItem[0].tracking_id.split('-')[1]);
      nextId = lastNum + 1;
    }
    const trackingId = `LF-${nextId}`;
    
    // Insert complaint
    const [complaintResult] = await db.query(
      'INSERT INTO complaint (user_id, location, complaint_date, complaint_status, item_name, item_description, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId || null, location, date, 'open', name, description || '', contactEmail]
    );
    
    // Insert item
    const [itemResult] = await db.query(
      'INSERT INTO item (item_type_id, complaint_id, status, tracking_id) VALUES (?, ?, ?, ?)',
      [itemTypeId, complaintResult.insertId, type, trackingId]
    );
    
    // Find potential matches using stored procedure
    const [matches] = await db.query(
      'CALL find_matches(?, ?, ?, ?, ?)',
      [itemResult.insertId, category, location, date, type]
    );
    
    res.json({ success: true, trackingId, itemId: itemResult.insertId, matches: matches[0] || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item report' });
  }
});

// Update item status (admin only)
app.patch('/api/items/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    const { status } = req.body;
    
    // Update item status (triggers will handle complaint closure)
    if (status === 'resolved') {
      await db.query('UPDATE item SET status = ? WHERE item_id = ?', ['found', req.params.id]);
    } else if (status === 'pending') {
      await db.query('UPDATE item SET status = ? WHERE item_id = ?', ['lost', req.params.id]);
    }
    
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as count FROM item');
    const [resolved] = await db.query('SELECT COUNT(*) as count FROM complaint WHERE complaint_status = "closed"');
    const [pending] = await db.query('SELECT COUNT(*) as count FROM complaint WHERE complaint_status = "open"');
    
    res.json({
      total: total[0].count,
      resolved: resolved[0].count,
      pending: pending[0].count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user count (admin only)
app.get('/api/users/count', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const [result] = await db.query('SELECT COUNT(*) as count FROM users');
    res.json({ count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

// Get only user's items
app.get('/api/items/my', requireAuth, async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM v_item_details WHERE user_email = ? ORDER BY item_date DESC',
      [req.session.userEmail]
    );
    
    const formatted = items.map(item => ({
      item_id: item.item_id,
      tracking_id: item.tracking_id,
      item_type: item.status,
      item_name: item.item_name,
      category: item.category,
      location: item.location,
      item_date: item.item_date,
      description: item.description,
      contact_email: item.contact_email,
      status: item.complaint_status === 'open' ? 'pending' : 'resolved'
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Delete item
app.delete('/api/items/:trackingId', requireAuth, async (req, res) => {
  try {
    // Get item to check ownership
    const [items] = await db.query('SELECT * FROM v_item_details WHERE tracking_id = ?', [req.params.trackingId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    
    const item = items[0];
    
    // Check if user owns the item or is admin
    if (req.session.userEmail !== item.user_email && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }
    
    // Delete item (cascade will delete complaint)
    await db.query('DELETE FROM item WHERE tracking_id = ?', [req.params.trackingId]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Update item status by tracking ID
app.patch('/api/items/:trackingId/status', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    const { status } = req.body;
    
    // Get item
    const [items] = await db.query('SELECT item_id FROM item WHERE tracking_id = ?', [req.params.trackingId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    
    // Update based on status
    if (status === 'resolved') {
      await db.query('UPDATE item SET status = ? WHERE tracking_id = ?', ['found', req.params.trackingId]);
    } else if (status === 'pending') {
      await db.query('UPDATE item SET status = ? WHERE tracking_id = ?', ['lost', req.params.trackingId]);
    }
    
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Resolve match endpoint
app.post('/api/items/resolve', requireAuth, async (req, res) => {
  try {
    const { myTrackingId, matchTrackingId } = req.body;
    if (!myTrackingId || !matchTrackingId) return res.status(400).json({ error: 'Missing tracking IDs' });

    const [myItemRows] = await db.query(
      'SELECT i.item_id, c.user_id FROM item i JOIN complaint c ON i.complaint_id = c.complaint_id WHERE i.tracking_id = ?',
      [myTrackingId]
    );
    const [matchItemRows] = await db.query(
      'SELECT i.item_id, c.user_id FROM item i JOIN complaint c ON i.complaint_id = c.complaint_id WHERE i.tracking_id = ?',
      [matchTrackingId]
    );
    if (!myItemRows.length || !matchItemRows.length) return res.status(404).json({ error: 'Item not found' });

    await db.query(`CREATE TABLE IF NOT EXISTS match_resolutions (
      match_id VARCHAR(255) NOT NULL,
      user_id INT NOT NULL,
      resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (match_id, user_id)
    )`);

    const matchId = [myTrackingId, matchTrackingId].sort().join('_');
    await db.query('INSERT IGNORE INTO match_resolutions (match_id, user_id) VALUES (?, ?)', [matchId, req.session.userId]);

    const [resolves] = await db.query('SELECT COUNT(*) as cnt FROM match_resolutions WHERE match_id = ?', [matchId]);
    if (resolves[0].cnt >= 2) {
      await db.query('UPDATE item SET status = "found" WHERE tracking_id IN (?, ?)', [myTrackingId, matchTrackingId]);
      await db.query('UPDATE complaint SET complaint_status = "closed" WHERE complaint_id IN (SELECT complaint_id FROM item WHERE tracking_id IN (?, ?))', [myTrackingId, matchTrackingId]);
      return res.json({ success: true, message: 'Both users resolved! Item marked as returned.' });
    }
    res.json({ success: true, message: 'Marked as resolved. Waiting for other user.' });
  } catch (err) {
    console.error('Resolve error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to mark as resolved' });
  }
});

// ── Email Contact Endpoint ──────────────────────────────────

app.post('/api/contact/send', async (req, res) => {
  try {
    const { senderName, senderEmail, recipientEmail, itemName, message } = req.body;

    if (!senderName || !senderEmail || !recipientEmail || !itemName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create test email account (or use production credentials)
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use production credentials (Gmail, Outlook, etc.)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // For testing: use Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@lostfound.local',
      to: recipientEmail,
      subject: `Lost & Found Portal: Interest in ${itemName}`,
      html: `
        <h2>New Contact from Lost & Found Portal</h2>
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>From:</strong> ${senderName}</p>
        <p><strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message || 'I am interested in the item you reported on the Lost & Found Portal.'}</p>
        <hr>
        <p><em>Please reply directly to ${senderEmail} to continue the conversation.</em></p>
        <p><small>This is an automated message from the Lost & Found Portal.</small></p>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // For test emails, provide preview URL
    const previewURL = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Test email sent. Preview: ${previewURL}`);

    res.json({ 
      success: true, 
      message: 'Email sent successfully!',
      previewUrl: previewURL // Include preview URL for test emails
    });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔍 Matching system enabled with stored procedures`);
  console.log(`⚡ Using original database structure with enhancements`);
});
