# Lost & Found Portal - DBMS Course Project

A full-stack web application for reporting and tracking lost/found items with intelligent matching system.

## 🎯 Features

- 🔐 User authentication (register/login with bcrypt)
- 📝 Report lost or found items
- 🔍 **Smart matching algorithm** - Automatically finds potential matches
- 📊 Track items using unique tracking IDs (LF-XXXX)
- 📈 Real-time statistics dashboard
- 🎨 Responsive UI with modern design
- ⚡ Database triggers for auto-status updates
- 🗄️ Stored procedures for efficient matching
- 📋 Database views for simplified queries

## 🏗️ Tech Stack

**Frontend:** HTML5, CSS3, JavaScript (Vanilla)  
**Backend:** Node.js, Express.js  
**Database:** MySQL with triggers, procedures, and views  
**Authentication:** bcryptjs, express-session

---

## 📊 Database Architecture

### Two Database Structures Available:

#### 1. **Original Structure** (from GitHub repo)
- `users` - User information
- `item_type` - Categories of items
- `complaint` - Lost/found reports
- `item` - Actual items linked to complaints

#### 2. **Enhanced Structure** (unified_schema.sql)
- Combines original structure with new features
- Adds authentication fields
- Includes triggers and stored procedures
- Creates views for easy querying

### Database Name: `lost_found_db`

---

## 🚀 Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/ADITYAGKARHADKAR/dbms_course_project.git
cd dbms_course_project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database

**Option A: Update `.env` file**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lost_found_db
PORT=3000
SESSION_SECRET=your_secret_key_here
```

**Option B: Update `deployment.ini` file**
```ini
[client]
user=root
password=your_mysql_password
database=lost_found_db
```

### 4. Create Database

**Using unified schema (recommended):**
```bash
mysql -u root -p < unified_schema.sql
```

**Using original structure:**
```bash
mysql -u root -p < drop_tables.sql
mysql -u root -p < user.sql
mysql -u root -p < item_type.sql
mysql -u root -p < complaint.sql
mysql -u root -p < item.sql
mysql -u root -p < item_trigger.sql
mysql -u root -p < complaint_trigger.sql
```

**Using deployment script (Windows):**
```bash
deployment.bat
```

### 5. Start Server

**Using unified structure:**
```bash
node server_unified.js
```

**Using original structure:**
```bash
node server.js
```

### 6. Access Application

Open browser: `http://localhost:3000`

---

## 📁 Database Schema Details

### Tables

#### **users**
```sql
user_id (PK)          - Auto-increment ID
user_name             - Full name
phone_no              - Contact number
email (UNIQUE)        - Email address
password_hash         - Encrypted password
role                  - 'user' or 'admin'
created_at            - Registration timestamp
```

#### **item_type**
```sql
item_type_id (PK)     - Auto-increment ID
item_description      - Category name (Camera, Phone, etc.)
```

#### **complaint** (Lost/Found Reports)
```sql
complaint_id (PK)     - Auto-increment ID
user_id (FK)          - Who reported it
location              - Where it was lost/found
complaint_date        - When it was lost/found
complaint_status      - 'open' or 'closed'
complaint_closure_date - When it was resolved
item_name             - Name of the item
item_description      - Detailed description
contact_email         - Contact information
```

#### **item** (Actual Items)
```sql
item_id (PK)          - Auto-increment ID
item_type_id (FK)     - Category reference
complaint_id (FK)     - Report reference
status                - 'lost' or 'found'
status_change_date    - When status changed
tracking_id (UNIQUE)  - Format: LF-XXXX
```

#### **claims** (For claiming items)
```sql
claim_id (PK)         - Auto-increment ID
item_id (FK)          - Which item
user_id (FK)          - Who claimed it
claim_description     - Why they think it's theirs
claim_status          - 'pending', 'approved', 'rejected'
created_at            - Claim timestamp
```

---

## 🎯 Smart Matching Algorithm

### How It Works:

When you report an item, the system automatically searches for potential matches:

**Scoring System:**
- **+3 points** - Same category (e.g., both are "Phone")
- **+2 points** - Similar location (e.g., both in "Library")
- **+1 point** - Recent date (within 7 days)

**Example:**
```
You report: LOST iPhone in Library on June 10

System finds:
✅ FOUND iPhone in Library on June 11 → 6 points (High Match)
⚠️ FOUND Samsung in Library Block B on June 15 → 5 points (Medium)
ℹ️ FOUND iPhone in Cafeteria on June 20 → 3 points (Low)
```

### Implementation:

**Stored Procedure:**
```sql
CALL find_matches(item_id, category, location, date, status);
```

**API Endpoint:**
```
GET /api/items/matches/:itemId
```

---

## 🔥 Database Triggers

### 1. Auto-Update Status Date
```sql
-- When item status changes, automatically update status_change_date
CREATE TRIGGER update_item_status_date
BEFORE UPDATE ON item
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        SET NEW.status_change_date = NOW();
    END IF;
END;
```

### 2. Auto-Close Complaint
```sql
-- When item status changes to 'found', close the complaint
CREATE TRIGGER close_complaint_on_found
AFTER UPDATE ON item
FOR EACH ROW
BEGIN
    IF NEW.status = 'found' AND OLD.status = 'lost' THEN
        UPDATE complaint 
        SET complaint_status = 'closed', 
            complaint_closure_date = NOW()
        WHERE complaint_id = NEW.complaint_id;
    END IF;
END;
```

---

## 📋 Database Views

### v_item_details
Complete item information with joins:
```sql
SELECT * FROM v_item_details;
-- Returns: item details + user info + category + complaint info
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/track/:trackingId` - Track item by ID
- `GET /api/items/matches/:itemId` - Get matching items
- `POST /api/items` - Create new item report (returns matches)
- `PATCH /api/items/:id/status` - Update item status (admin)

### Stats
- `GET /api/stats` - Get dashboard statistics

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session-based authentication
- ✅ SQL injection prevention (parameterized queries)
- ✅ Role-based access control (admin/user)
- ✅ CORS configuration
- ✅ Input validation

---

## 📂 Project Structure

```
dbms_course_project/
├── Frontend Files
│   ├── index.html              # Main page
│   ├── style.css               # Styling
│   ├── frontend.js             # API calls & interactivity
│   └── how-it-works.html       # Help page
│
├── Backend Files
│   ├── server.js               # Express server (original)
│   ├── server_unified.js       # Express server (unified schema)
│   └── db.js                   # MySQL connection
│
├── Database Files (Original)
│   ├── user.sql                # Users table
│   ├── item_type.sql           # Item types table
│   ├── complaint.sql           # Complaints table
│   ├── item.sql                # Items table
│   ├── item_trigger.sql        # Item triggers
│   ├── complaint_trigger.sql   # Complaint triggers
│   └── drop_tables.sql         # Drop all tables
│
├── Database Files (Enhanced)
│   ├── schema.sql              # Simple schema
│   └── unified_schema.sql      # Complete schema with triggers/procedures
│
├── Configuration
│   ├── package.json            # Dependencies
│   ├── .env                    # Environment variables
│   ├── deployment.ini          # MySQL config
│   ├── deployment.bat          # Windows deployment script
│   └── setup.sh                # Unix setup script
│
└── Documentation
    └── README.md               # This file
```

---

## 🧪 Testing the Matching System

### Test Scenario:

1. **Report a LOST item:**
   - Name: "iPhone 13"
   - Category: "Phone"
   - Location: "Library"
   - Date: Today

2. **System automatically shows matches:**
   - Found iPhone in Library (High match)
   - Found Samsung in Library Block B (Medium match)

3. **Contact the person** via displayed email

---

## 👥 Default Users

```
Admin:
Email: admin@portal.com
Password: admin123

Users:
- aditya@gmail.com
- suresh@gmail.com
- arnav@gmail.com
- girish@gmail.com
- rahul@gmail.com
(All passwords: admin123)
```

---

## 🎓 Database Concepts Demonstrated

1. **Normalization** - Tables in 3NF
2. **Foreign Keys** - Referential integrity
3. **Triggers** - Auto-update status and dates
4. **Stored Procedures** - Matching algorithm
5. **Views** - Simplified complex queries
6. **Indexes** - Performance optimization
7. **Constraints** - Data validation (CHECK, UNIQUE)
8. **Transactions** - ACID properties maintained

---

## 🚀 Future Enhancements

- [ ] Image upload for items
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Claim management system
- [ ] Advanced search with filters
- [ ] Export reports to PDF
- [ ] Mobile app
- [ ] Real-time notifications

---

## 📝 License

MIT License

---

## 👨‍💻 Contributors

- Aditya Karhadkar
- Atharva Lanke

---

## 📞 Support

For issues or questions, please open an issue on GitHub:
https://github.com/ADITYAGKARHADKAR/dbms_course_project/issues

---

## 🌟 Acknowledgments

This project demonstrates practical implementation of:
- Database Management Systems concepts
- Full-stack web development
- RESTful API design
- SQL triggers and stored procedures
- User authentication and authorization

**Course:** Database Management Systems  
**Institution:** [Your Institution Name]  
**Year:** 2025
