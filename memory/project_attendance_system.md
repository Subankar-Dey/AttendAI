---
name: project_attendance_system
description: AI-powered student attendance management system with role-based access
type: project
---

## Project: Attendance System

**Location:** `C:\D-DRIVE\Projects\attendence_system`

**Status:** Planning stage — detailed spec defined

**Stack:** React.js + Tailwind CSS + Node.js/Express + MongoDB

**Name:** AttendAI (recommended)

---

## Architecture Overview

### Roles
- **Admin**: Full control — users, academics, attendance, reports, AI insights, settings, security
- **Staff**: Mark/manage attendance, view classes, reports, AI assistance
- **Student**: View own attendance, request corrections, AI assistant

### Tech Stack
- Frontend: React + Tailwind CSS + Recharts (charts)
- Backend: Node.js + Express
- Database: MongoDB
- AI features: prediction, anomaly detection, chatbot, OCR (image→timetable)

---

## Key Features

### Admin Navigation Categories
1. Dashboard (stats, graphs, AI alerts)
2. User Management (students, staff, admins)
3. Academic Management (departments, classes, subjects, timetable)
4. Attendance Management (mark, view, absentees, logs)
5. Reports & Analytics (daily, monthly, class-wise, exports)
6. Notifications & Communication
7. AI Insights (predictions, at-risk, anomaly detection, AI assistant)
8. System Settings (rules, holidays, working days)
9. Access Control & Security (roles, audit logs)
10. Support

### AI Features
- **Attendance prediction** — identify at-risk students/staff
- **Anomaly detection** — flag suspicious attendance patterns
- **Chatbot assistant** — role-based (admin/staff/student have different AI panels)
- **Quick prompts**: Generate timetable, Create PDF, Export reports
- **OCR**: Image → structured timetable
- **Email verification** on registration

### Charts & Visualization (Recharts)
- Absentees overview (line/bar chart)
- Staff attendance monitoring (bar chart)
- Class-wise absentees (stacked bar)
- Below 75% defaulters (donut/pie + severity breakdown: <50% critical, 50-65% high, 65-75% warning)
- Personal attendance trends (students)
- Clickable graphs → filter table data

### Absentees Feature
- Unified view: students + staff absentees
- Filters: date, role, class/dept
- Search: name, ID, roll number
- Pagination (not all at once)
- Role-based visibility (staff see only their classes)

---

## Operations by Role

### Admin
- CRUD users (students, staff, admins)
- Manage academic structure (depts, classes, subjects)
- View/edit all attendance
- Generate reports (PDF/Excel)
- AI: predictions, anomaly detection, bulk notifications
- System settings, audit logs

### Staff
- Mark attendance (daily/session-wise)
- View assigned classes/students
- Class-level reports
- AI: suggestions for at-risk students, auto-fill attendance

### Student
- View personal attendance (% per subject)
- Attendance history (daily/monthly)
- Request attendance correction
- AI: "How many classes can I miss?", attendance predictions

---

## Proposed Directory Structure

```
attendance-system/
├── frontend/ (React + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── attendance/
│   │   │   ├── charts/
│   │   │   └── ai/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── staff/
│   │   │   ├── student/
│   │   │   ├── auth/
│   │   │   └── ai/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│
├── backend/ (Node.js + Express)
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── utils/
```

---

## Approach

- Use multiple Claude Code agents in parallel (frontend, backend, DevOps)
- Build in phases: core → features → AI layer
- Start with SPEC.md, then build incrementally