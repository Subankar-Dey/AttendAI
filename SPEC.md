# AttendAI — AI-Powered Student Attendance Management System

## 1. Project Overview

**Project Name:**

**Type:** Full-stack web application (MERN Stack + AI)

**Core Functionality:** Role-based attendance management system with AI-powered insights, predictions, anomaly detection, and intelligent automation for educational institutions.

**Target Users:** Administrators, Staff (teachers), Students

---

## 2. Technology Stack

### Frontend

- **Framework:** React.js 18+ (Vite)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Routing:** React Router v6
- **State:** React Context API
- **HTTP Client:** Axios

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** express-validator

### AI Features

- Attendance prediction
- Anomaly detection
- Role-based chatbot
- OCR (image → timetable)
- Quick prompts (generate timetable, PDF export)

---

## 3. User Roles & Permissions

### Admin

- Manage users (students, staff, admins)
- Academic structure (departments, classes, subjects, timetable)
- View/edit all attendance records
- Generate reports (PDF/Excel)
- AI: predictions, anomaly detection, bulk notifications
- System settings, audit logs

### Staff

- Mark attendance (daily/session-wise)
- View assigned classes/students
- Class-level reports
- AI: at-risk student suggestions, auto-fill attendance

### Student

- View personal attendance (% per subject)
- Attendance history (daily/monthly)
- Request attendance correction
- AI: "How many classes can I miss?", attendance predictions

---

## 4. Core Features

### 4.1 Authentication & Authorization

- JWT-based authentication
- Email verification on registration
- Role-based access control (RBAC)
- Password reset functionality

### 4.2 Admin Navigation Categories

1. **Dashboard** — stats, graphs, AI alerts
2. **User Management** — students, staff, admins, roles
3. **Academic Management** — departments, classes, subjects, timetable
4. **Attendance Management** — mark, view, absentees, logs
5. **Reports & Analytics** — daily, monthly, class-wise, exports
6. **Notifications** — announcements, email/SMS logs
7. **AI Insights** — predictions, at-risk, anomaly detection
8. **System Settings** — rules, holidays, working days
9. **Access Control** — roles, audit logs
10. **Support** — help, documentation

### 4.3 Attendance Management

- Mark attendance (daily/session-wise)
- View attendance records
- Absentees list (students + staff, searchable)
- Attendance logs (history of changes)

### 4.4 Reports & Analytics

- Daily/monthly reports
- Class-wise reports
- Staff attendance reports
- Export to PDF/Excel
- Below 75% defaulters (severity: <50% critical, 50-65% high, 65-75% warning)

### 4.5 AI Features

- **Attendance Prediction:** Identify at-risk students/staff
- **Anomaly Detection:** Flag suspicious attendance patterns
- **Chatbot:** Role-based AI assistant (admin, staff, student panels)
- **Quick Prompts:** Generate timetable, Create PDF, Export reports
- **OCR:** Image → structured timetable conversion

---

## 5. Database Schema

### Users Collection

```json
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: Enum["admin", "staff", "student"],
  emailVerified: Boolean,
  department: ObjectId (ref: Department),
  class: ObjectId (ref: Class),
  attendance: [{
    date: Date,
    status: Enum["present", "absent", "late"],
    markedBy: ObjectId
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Department Collection

```json
{
  _id: ObjectId,
  name: String,
  code: String,
  createdAt: Date
}
```

### Class Collection

```json
{
  _id: ObjectId,
  name: String,
  department: ObjectId (ref: Department),
  subjects: [ObjectId],
  classTeacher: ObjectId (ref: User),
  createdAt: Date
}
```

### Attendance Collection

```json
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  class: ObjectId (ref: Class),
  date: Date,
  status: Enum["present", "absent", "late"],
  markedBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Subject Collection

```json
{
  _id: ObjectId,
  name: String,
  code: String,
  class: ObjectId (ref: Class)
}
```

---

## 6. API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/verify-email` — Verify email
- `POST /api/auth/forgot-password` — Forgot password
- `POST /api/auth/reset-password` — Reset password

### Users

- `GET /api/users` — Get all users (admin)
- `POST /api/users` — Create user (admin)
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user (admin)

### Attendance

- `POST /api/attendance/mark` — Mark attendance (staff)
- `GET /api/attendance` — Get attendance records
- `GET /api/attendance/absent` — Get absentees list
- `GET /api/attendance/low-attendance` — Get below 75% users

### Reports

- `GET /api/reports/daily` — Daily report
- `GET /api/reports/monthly` — Monthly report
- `GET /api/reports/class/:id` — Class-wise report
- `GET /api/reports/export` — Export to PDF/Excel

### AI

- `POST /api/ai/predict` — Predict attendance
- `POST /api/ai/analyze` — Anomaly detection
- `POST /api/ai/chat` — AI chatbot
- `POST /api/ai/ocr` — Image to timetable OCR

### Academic

- `GET/POST /api/departments` — Departments CRUD
- `GET/POST /api/classes` — Classes CRUD
- `GET/POST /api/subjects` — Subjects CRUD

---

## 7. Frontend Directory Structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/ (Button, Input, Modal, Card, etc.)
│   │   ├── layout/ (Navbar, Sidebar, Footer)
│   │   ├── attendance/ (AttendanceTable, AbsenteeTable)
│   │   ├── charts/ (LineChart, BarChart, PieChart, etc.)
│   │   └── ai/ (Chatbot, PromptButtons, FileUpload)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── academics/
│   │   │   ├── attendance/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── ai/
│   │   │   ├── settings/
│   │   │   └── security/
│   │   ├── staff/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MarkAttendance.jsx
│   │   │   ├── ViewClasses.jsx
│   │   │   ├── Absentees.jsx
│   │   │   └── AIAssistant.jsx
│   │   ├── student/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AttendanceView.jsx
│   │   │   ├── Requests.jsx
│   │   │   └── AIAssistant.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── NotFound.jsx
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── attendanceService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useAttendance.js
│   └── utils/
│       ├── formatDate.js
│       └── roleHelpers.js
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 8. Backend Directory Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── attendanceController.js
│   │   ├── reportController.js
│   │   └── aiController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── attendance.js
│   │   ├── reports.js
│   │   └── ai.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Class.js
│   │   ├── Subject.js
│   │   └── Attendance.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── emailService.js
│   └── utils/
│       └── helpers.js
├── .env
├── server.js
└── package.json
```

---

## 9. Charts & Visualization

Using **Recharts**:

| Chart                | Use Case          | Type        |
| -------------------- | ----------------- | ----------- |
| Absentees Overview   | Admin dashboard   | Line/Area   |
| Staff Attendance     | Admin dashboard   | Bar         |
| Class-wise Absentees | Admin dashboard   | Stacked Bar |
| Below 75% Defaulters | Admin/Staff       | Donut/Pie   |
| Severity Breakdown   | Admin             | Stacked Bar |
| Personal Attendance  | Student dashboard | Line        |
| Attendance Trend     | Staff dashboard   | Line        |

**Clickable graphs → filters table data**

---

## 10. AI Feature Details

### Role-Based AI Panels

**Admin AI:**

- Generate timetable
- Detect anomalies
- Bulk notifications
- At-risk students list
- Attendance predictions

**Staff AI:**

- Auto-suggest attendance
- At-risk students in class
- Class reports
- Generate timetable (assigned classes)

**Student AI:**

- "What is my attendance %?"
- "How many classes can I miss?"
- Attendance predictions
- PDF report generation

### Quick Prompts

- 📅 "Generate timetable"
- 📄 "Create PDF from image"
- 📊 "Show attendance report"
- ⚠️ "List low attendance users"

### OCR Flow

1. User uploads timetable image
2. AI extracts text (OCR)
3. Converts to structured data
4. Save/export as PDF

---

## 11. Implementation Phases

### Phase 1: Core Setup

- Initialize React + Vite frontend
- Initialize Node.js + Express backend
- Set up MongoDB connection
- Configure Tailwind CSS

### Phase 2: Authentication

- JWT auth system
- Email verification
- Role-based access

### Phase 3: Core Features

- User management CRUD
- Class/subject management
- Attendance marking
- Attendance viewing

### Phase 4: Reports & Charts

- Dashboard with stats
- Charts (Recharts)
- PDF/Excel export

### Phase 5: AI Features

- AI chatbot
- Attendance prediction
- Anomaly detection
- OCR integration

---

## 12. Environment Variables

```
# Backend
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendai
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
EMAIL_SERVICE=smtp
EMAIL_USER=your-email
EMAIL_PASS=your-password

# Frontend
VITE_API_URL=http://localhost:5000/api
```
