# AttendAI — AI-Powered Student Attendance Management System

> A production-ready, full-stack web application for managing student attendance with role-based access control, real-time analytics, and AI-powered insights.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Setup Guide](#-setup-guide)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Start MongoDB with Docker](#step-2-start-mongodb-with-docker)
  - [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
  - [Step 4: Install Dependencies](#step-4-install-dependencies)
  - [Step 5: Seed the Database](#step-5-seed-the-database)
  - [Step 6: Start Development Servers](#step-6-start-development-servers)
- [Default Credentials](#-default-credentials)
- [API Endpoints](#-api-endpoints)
- [Role-Based Access](#-role-based-access)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core
- ✅ JWT-based authentication (login, register, email verification)
- ✅ Role-based access control (Admin, Staff, Student)
- ✅ Attendance marking with bulk operations
- ✅ Real-time dashboard with charts (Recharts)
- ✅ Defaulters detection (< 75% attendance with severity levels)
- ✅ Search and filter across all data tables
- ✅ Audit logging for all critical actions
- ✅ Rate limiting and security headers (Helmet)

### AI Features
- 🤖 Role-based AI chatbot assistant
- 📊 Attendance prediction and risk analysis
- ⚠️ Anomaly detection for suspicious patterns
- ⚡ Quick prompt buttons per role

### Reports & Analytics
- 📈 Daily and monthly attendance reports
- 📊 Class-wise breakdown analysis
- 📋 Absentees list with real-time search
- 📉 Below 75% defaulters with severity (Critical / High / Warning)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Recharts, Axios |
| **Backend** | Node.js 18+, Express.js, Mongoose ODM |
| **Database** | MongoDB 7 (via Docker) |
| **Auth** | JWT (JSON Web Tokens), bcryptjs |
| **Security** | Helmet, CORS, express-rate-limit |
| **Icons** | Lucide React |
| **Dev Tools** | Nodemon, Concurrently |

---

## 📦 Prerequisites

Make sure you have the following installed on your system:

| Tool | Version | Download Link |
|------|---------|--------------|
| **Node.js** | 18+ | https://nodejs.org/ |
| **npm** | 9+ | Comes with Node.js |
| **Docker** | Latest | https://www.docker.com/products/docker-desktop/ |
| **Git** | Latest | https://git-scm.com/ |

### Verify installation:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
docker --version  # Should show Docker version xx.x.x
```

---

## 📁 Project Structure

```
attendence_system/
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Modal, Card, Table, etc.
│   │   │   ├── layout/         # Navbar, Sidebar, Footer, DashboardLayout
│   │   │   └── charts/         # LineChart, BarChart, PieChart
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── admin/          # Dashboard, Users, Academics, Attendance,
│   │   │   │                   # Reports, Notifications, AI, Settings, Security
│   │   │   ├── staff/          # Dashboard, MarkAttendance, Classes,
│   │   │   │                   # Absentees, AIAssistant
│   │   │   └── student/        # Dashboard, AttendanceView, Requests,
│   │   │                       # AIAssistant
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── services/           # api.js, authService, attendanceService, etc.
│   │   ├── hooks/              # useAuth, useAttendance, useDebounce, etc.
│   │   ├── routes/             # AppRoutes, ProtectedRoute
│   │   └── utils/              # helpers, formatDate, roleHelpers
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── backend/                    # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── controllers/        # auth, user, attendance, dashboard,
│   │   │                       # report, ai, class, department, etc.
│   │   ├── models/             # User, Attendance, Class, Department,
│   │   │                       # Subject, AuditLog, Notification, Settings
│   │   ├── routes/             # All API route definitions
│   │   ├── middleware/         # auth, roleCheck, errorHandler,
│   │   │                       # rateLimiter, auditLogger
│   │   └── utils/              # AppError, catchAsync, seed.js
│   ├── .env                    # Environment variables (local)
│   ├── .env.example            # Template for environment variables
│   └── package.json
│
├── docker-compose.yml          # MongoDB + Mongo Express containers
├── package.json                # Root monorepo config (concurrently)
├── SPEC.md                     # Full project specification
├── CLAUDE.md                   # AI assistant context file
└── README.md                   # ← You are here
```

---

## 🚀 Setup Guide

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd attendence_system
```

---

### Step 2: Start MongoDB with Docker

This project uses **Docker** to run MongoDB. Make sure Docker Desktop is running.

```bash
# Start MongoDB and Mongo Express containers
docker-compose up -d
```

This will start:
- **MongoDB** on `localhost:27017` (database)
- **Mongo Express** on `localhost:8081` (web-based DB admin panel)

**Verify containers are running:**

```bash
docker ps
```

You should see two containers: `attendai-mongo` and `attendai-mongo-express`.

> 💡 **Tip:** Open http://localhost:8081 in your browser to access the Mongo Express admin panel and visually browse your database.

**If you don't have Docker**, install MongoDB locally:
- Download from https://www.mongodb.com/try/download/community
- Start the MongoDB service
- Make sure it's running on `localhost:27017`

---

### Step 3: Configure Environment Variables

The backend `.env` file is pre-configured with defaults. If you need to customize:

```bash
# Navigate to backend folder
cd backend

# Edit .env (already created with defaults)
# Or copy from template:
cp .env.example .env
```

**Backend `.env` contents:**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendai
JWT_SECRET=attendai-dev-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Email Configuration (optional for dev)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env` (optional):**

Create `frontend/.env` if the default API URL doesn't work:

```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 4: Install Dependencies

From the **root directory**, install all dependencies (root + frontend + backend):

```bash
# Install root dependencies (concurrently)
npm install

# Install frontend and backend dependencies
npm run install:all
```

Or install separately:

```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..
```

---

### Step 5: Seed the Database

This creates demo users, departments, classes, subjects, and 30 days of attendance data.

```bash
npm run seed
```

**Expected output:**

```
✅ Connected to MongoDB for seeding
👤 Admin created: admin@attendai.com / admin123
🏫 Departments ready
📚 Classes ready
📖 Subjects ready
👨‍🏫 Staff created: staff@attendai.com / staff123
🎓 Student created: ravi@attendai.com
🎓 Student created: anita@attendai.com
🎓 Student created: kiran@attendai.com
🎓 Student created: priya@attendai.com
🎓 Student created: amit@attendai.com
📊 Seeded 105 attendance records

✅ Seeding complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default credentials:
  Admin:   admin@attendai.com / admin123
  Staff:   staff@attendai.com / staff123
  Student: ravi@attendai.com  / student123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 6: Start Development Servers

```bash
# Start BOTH frontend and backend simultaneously
npm run dev
```

Or start them separately in two terminals:

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

**Access the application:**

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 (or http://localhost:3000) |
| **Backend API** | http://localhost:5000 |
| **API Health Check** | http://localhost:5000/api/health |
| **Mongo Express** | http://localhost:8081 |

---

## 🔐 Default Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | `admin@attendai.com` | `admin123` | Full system access |
| **Staff** | `staff@attendai.com` | `staff123` | Class & attendance management |
| **Student** | `ravi@attendai.com` | `student123` | Personal attendance only |

> 💡 On the login page, click the **Admin**, **Staff**, or **Student** buttons to auto-fill credentials.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/mark` | Mark attendance (bulk) |
| GET | `/api/attendance` | Get records (with filters) |
| GET | `/api/attendance/absent` | Get absentees by date |
| GET | `/api/attendance/low-attendance` | Get below 75% users |
| GET | `/api/attendance/student/:id` | Get student's records |
| GET | `/api/attendance/logs` | Get audit logs |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/monthly` | Monthly report |
| GET | `/api/reports/class/:id` | Class-wise report |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/predict` | Predict student risk |
| POST | `/api/ai/analyze` | Detect anomalies |
| POST | `/api/ai/chat` | AI chatbot |
| POST | `/api/ai/ocr` | Image to timetable (placeholder) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Overview statistics |
| GET | `/api/dashboard/charts` | Chart data |

---

## 👤 Role-Based Access

### Admin
- System-wide dashboard with analytics
- Full user management (CRUD)
- Academic management (departments, classes, subjects)
- View/edit all attendance records
- Identify defaulters (< 75%)
- Generate reports (daily/monthly)
- Send notifications
- AI insights (predictions, anomalies)
- System settings and audit logs

### Staff
- Class-level dashboard
- Mark attendance (with bulk actions)
- View assigned classes and students
- View absentees (with search)
- AI assistant for class management

### Student
- Personal attendance dashboard with risk alerts
- View attendance history (month-by-month)
- Submit correction requests
- AI assistant for attendance queries

---

## 🛑 Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Make sure Docker is running and MongoDB container is up:
```bash
docker-compose up -d
docker ps   # Verify containers
```

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Fix:** Kill the process using the port:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Frontend Can't Connect to Backend
**Fix:** Ensure both servers are running and check CORS settings in `backend/src/app.js`. The `FRONTEND_URL` in `.env` must match your frontend URL.

### Seed Command Fails
**Fix:** Make sure MongoDB is running before seeding:
```bash
docker-compose up -d
npm run seed
```

### Mongoose Duplicate Index Warning
This is a non-breaking warning. It means some indexes are defined in both the schema and with `schema.index()`. It does not affect functionality.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run install:all` | Install all dependencies |
| `npm run seed` | Seed database with demo data |
| `docker-compose up -d` | Start MongoDB + Mongo Express |
| `docker-compose down` | Stop all Docker containers |
| `docker-compose down -v` | Stop containers + delete data |

---

## 📄 License

This project is for educational purposes.

---

Built with ❤️ using React, Node.js, MongoDB, and Tailwind CSS.