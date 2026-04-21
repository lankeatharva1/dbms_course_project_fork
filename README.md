# Lost & Found Portal

A full-stack web application for reporting and tracking lost/found items with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

- 🔐 User authentication (register/login)
- 📝 Report lost or found items
- 🔍 Browse and filter items by category, type, status
- 📊 Track items using unique tracking IDs
- 📈 Real-time statistics dashboard
- 🎨 Responsive UI with modern design

## Tech Stack

**Frontend:** HTML5, CSS3, JavaScript (Vanilla)  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Authentication:** bcryptjs, express-session

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Edit `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lost_found_db
PORT=3000
SESSION_SECRET=your_secret_key_here
```

### 3. Create Database

Run the SQL schema:

```bash
mysql -u root -p < schema.sql
```

Or manually execute `schema.sql` in MySQL Workbench/phpMyAdmin.

### 4. Start Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 5. Access Application

Open browser and navigate to:
```
http://localhost:3000
```

## Database Schema

### Users Table
- `user_id` (PK)
- `full_name`
- `email` (unique)
- `password_hash`
- `role` (user/admin)
- `created_at`

### Items Table
- `item_id` (PK)
- `tracking_id` (unique, format: LF-XXXX)
- `user_id` (FK)
- `item_type` (lost/found)
- `item_name`
- `category`
- `location`
- `item_date`
- `description`
- `contact_email`
- `status` (pending/resolved/closed)
- `created_at`, `updated_at`

### Claims Table
- `claim_id` (PK)
- `item_id` (FK)
- `user_id` (FK)
- `claim_description`
- `claim_status` (pending/approved/rejected)
- `created_at`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/track/:trackingId` - Track item by ID
- `POST /api/items` - Create new item report
- `PATCH /api/items/:id/status` - Update item status (admin)

### Stats
- `GET /api/stats` - Get dashboard statistics

## Default Credentials

**Admin Account:**
- Email: `admin@portal.com`
- Password: `admin123`

## Project Structure

```
DBMS/
├── index.html          # Main HTML page
├── style.css           # Stylesheet
├── frontend.js         # Frontend JavaScript (API calls)
├── server.js           # Express server & API routes
├── db.js               # Database connection
├── schema.sql          # Database schema
├── package.json        # Dependencies
├── .env                # Environment variables
└── README.md           # Documentation
```

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- SQL injection prevention (parameterized queries)
- Role-based access control (admin/user)
- CORS configuration

## Future Enhancements

- Image upload for items
- Email notifications
- Admin dashboard
- Claim management system
- Advanced search with filters
- Export reports to PDF

## License

MIT License
