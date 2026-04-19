# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AttendAI** — AI-powered student attendance management system.
Built with React + Tailwind (frontend) and Node.js + Express + MongoDB (backend).

## Architecture

### Frontend (React + Vite)
- Feature-based component structure
- Role-based routing with ProtectedRoute
- Context API for auth state
- Axios with JWT interceptor
- Recharts for data visualization

### Backend (Node.js + Express)
- Controller → Service → Model pattern
- Middleware chain: auth → role → controller
- JWT authentication with bcrypt
- Mongoose ODM with proper indexes

### Key Patterns

```javascript
// Backend route structure
router.post('/', authMiddleware, roleCheck('admin'), controllerMethod);

// Frontend API service with interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## Commands

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Seed database
npm run seed

# Start MongoDB via Docker
docker-compose up -d
```

## Environment Variables

**Backend (`backend/.env`):**
- `PORT` — Server port (default: 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — Token expiry (default: 7d)

**Frontend (`frontend/.env`):**
- `VITE_API_URL` — Backend API URL

## API Integration

Frontend connects to backend at `http://localhost:5000/api`.
Axios interceptor automatically adds JWT token to requests.

## Key Models

- **User** — name, email, password, role (admin/staff/student)
- **Attendance** — student, class, date, status (present/absent/late)
- **Class** — name, department, classTeacher, subjects
- **Department** — name, code

## Default Credentials

- Admin: `admin@attendai.com` / `admin123`
- Staff: `staff@attendai.com` / `staff123`
- Student: `ravi@attendai.com` / `student123`

## Status

Phase 1 (Core Backend) complete. Frontend scaffolding in progress.