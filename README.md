# 🌿 EcoServe — Waste Collection & Management System

A full-stack web application for managing urban waste collection with role-based dashboards for **Admins**, **Collectors**, and **Citizens**.

---

## 📁 Project Structure

```
ecoserve/
├── config/
│   └── db.js                  # MySQL connection pool
├── database/
│   └── schema.sql             # Full DB schema + seed data
├── middleware/
│   └── auth.js                # JWT auth + role guard
├── routes/
│   ├── auth.js                # Register, Login, Profile
│   ├── requests.js            # Pickup request CRUD
│   ├── complaints.js          # Complaints system
│   ├── schedules.js           # Schedules + Admin analytics
│   └── reports.js             # Waste reports
├── public/
│   ├── index.html             # Landing page
│   ├── css/style.css          # Global design system
│   ├── js/
│   │   ├── main.js            # API helpers, utilities
│   │   └── layout.js          # Dynamic navbar + sidebar
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── profile.html
│       ├── dashboard-admin.html
│       ├── admin-requests.html
│       ├── admin-schedules.html
│       ├── admin-complaints.html
│       ├── admin-reports.html
│       ├── admin-collectors.html
│       ├── admin-citizens.html
│       ├── dashboard-citizen.html
│       ├── citizen-request.html
│       ├── citizen-my-requests.html
│       ├── citizen-complaints.html
│       ├── dashboard-collector.html
│       ├── collector-pickups.html
│       ├── collector-schedule.html
│       └── collector-reports.html
├── server.js                  # Express entry point
├── package.json
└── .env                       # Environment variables
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | HTML5, CSS3, Bootstrap 5, Vanilla JS        |
| Backend    | Node.js, Express.js                         |
| Database   | MySQL 8+                                    |
| Auth       | JWT (jsonwebtoken) + bcryptjs               |
| Charts     | Chart.js 4                                  |
| Icons      | Font Awesome 6                              |
| Fonts      | Google Fonts (Syne + DM Sans)               |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm

### 2. Clone / Extract the Project
```bash
cd ecoserve
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup MySQL Database
Open MySQL Workbench or your terminal and run:
```sql
mysql -u root -p < database/schema.sql
```
This creates the `ecoserve` database, all tables, and seed demo users.

### 5. Configure Environment
Edit the `.env` file:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=ecoserve
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
```

### 6. Start the Server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### 7. Open in Browser
```
/'api'
```

---

## 👥 Demo Credentials

All demo accounts use password: **`password`**

| Role      | Email                      | Password   |
|-----------|----------------------------|------------|
| Admin     | admin@ecoserve.com         | password   |
| Collector | collector@ecoserve.com     | password   |
| Citizen   | citizen@ecoserve.com       | password   |

> Use the **Quick Demo Login** buttons on the login page for one-click access.

---

## 🤖 AI Features Setup (EcoBot — Powered by Groq)

To enable the AI chat assistant, add your Groq API key to `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### How to get a FREE Groq API Key:
1. Go to ****
2. Sign in with your Groq account
3. Click **"Create API Key"**
4. Copy the key and paste it in `.env`
5. Restart the server: `npm run dev`

> Without the key, EcoBot runs in **offline mode** and serves helpful pre-written eco tips automatically — no errors shown to users.

### Groq Model Used:
- **groq** — Fast, free tier available, great for chat

---

## 🗺️ Feature Map

### 🔐 Auth
- Register as Citizen or Collector
- Secure JWT login with role-based redirect
- Change password, edit profile

### 🏠 Citizen
- Submit waste pickup requests (5 waste types, 3-step wizard)
- Track request status with progress bars
- File and track complaints with admin responses
- View complete request history

### 🚛 Collector
- View all assigned pickups with citizen contact info
- Update pickup status (In Progress → Completed)
- View daily/weekly collection schedules by zone
- Submit waste collection reports with weight data

### 🔧 Admin
- Analytics dashboard (Chart.js charts, live stats)
- Manage all pickup requests, assign collectors
- Create collection schedules per zone/shift
- Review and respond to complaints with priority tracking
- View collector leaderboard and performance
- Manage citizen/collector accounts (activate/deactivate)
- Waste reports with filters and monthly analytics

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint                | Description         |
|--------|-------------------------|---------------------|
| POST   | /api/auth/register      | Register user       |
| POST   | /api/auth/login         | Login               |
| GET    | /api/auth/profile       | Get own profile     |
| PUT    | /api/auth/profile       | Update profile      |
| PUT    | /api/auth/change-password | Change password   |

### Pickup Requests
| Method | Endpoint                        | Role      |
|--------|---------------------------------|-----------|
| POST   | /api/requests                   | Citizen   |
| GET    | /api/requests/my                | Citizen   |
| GET    | /api/requests/assigned          | Collector |
| GET    | /api/requests/all               | Admin     |
| PUT    | /api/requests/:id/assign        | Admin     |
| PUT    | /api/requests/:id/status        | Collector |
| DELETE | /api/requests/:id               | Citizen   |

### Complaints
| Method | Endpoint                          | Role    |
|--------|-----------------------------------|---------|
| POST   | /api/complaints                   | Citizen |
| GET    | /api/complaints/my                | Citizen |
| GET    | /api/complaints/all               | Admin   |
| PUT    | /api/complaints/:id/respond       | Admin   |

### Schedules
| Method | Endpoint                          | Role      |
|--------|-----------------------------------|-----------|
| POST   | /api/schedules                    | Admin     |
| GET    | /api/schedules/my                 | Collector |
| GET    | /api/schedules/all                | Admin     |
| PUT    | /api/schedules/:id/status         | Collector |

### Reports
| Method | Endpoint                          | Role      |
|--------|-----------------------------------|-----------|
| POST   | /api/reports                      | Collector |
| GET    | /api/reports/my                   | Collector |
| GET    | /api/reports/all                  | Admin     |
| GET    | /api/reports/analytics            | Admin     |

### Admin
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/admin/stats                  | Dashboard stats          |
| GET    | /api/admin/collectors             | All collectors           |
| GET    | /api/admin/citizens               | All citizens             |
| PUT    | /api/admin/users/:id/toggle       | Activate/deactivate user |
| GET    | /api/admin/notifications          | User notifications       |

---

## 🎨 Design System

- **Primary Color**: `#22883f` (Forest Green)
- **Font Display**: Syne (headers/titles)
- **Font Body**: DM Sans (body text)
- **Border Radius**: 14px cards, 8px inputs, 22px modals
- **Status Colors**: Amber (pending) · Blue (assigned) · Purple (in progress) · Green (completed) · Red (cancelled)

---

## 🚀 Deployment Notes

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like **PM2**: `pm2 start server.js --name ecoserve`
3. Use **Nginx** as a reverse proxy on port 80/443
4. Replace the JWT secret with a cryptographically secure random string
5. Enable SSL/HTTPS in production

---

## 📦 npm Packages Used

```json
{
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-validator": "^7.0.1",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "mysql2": "^3.6.5",
  "nodemon": "^3.0.2"
}
```

---

## 🌿 Made with EcoServe
*Smarter Waste. Cleaner Cities.*
