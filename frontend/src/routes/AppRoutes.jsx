import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import NotFound from '../pages/NotFound'
import DashboardLayout from '../components/layout/DashboardLayout'

// Admin pages
import AdminDashboard from '../pages/admin/dashboard/Dashboard'
import AdminUsers from '../pages/admin/users/Users'
import AdminAcademics from '../pages/admin/academics/Academics'
import AdminAttendance from '../pages/admin/attendance/Attendance'
import AdminReports from '../pages/admin/reports/Reports'
import AnalyticsDashboard from '../pages/admin/AnalyticsDashboard'
import RequestsApproval from '../pages/admin/Requests'
import AdminProfiles from '../pages/admin/AdminProfiles'
import AdminNotifications from '../pages/admin/notifications/Notifications'
import AdminAI from '../pages/admin/ai/AI'
import AdminSettings from '../pages/admin/settings/Settings'
import AdminSecurity from '../pages/admin/security/Security'

// Staff pages
import StaffDashboard from '../pages/staff/Dashboard'
import MarkAttendance from '../pages/staff/MarkAttendance'
import ViewClasses from '../pages/staff/ViewClasses'
import Absentees from '../pages/staff/Absentees'
import StaffAI from '../pages/staff/AIAssistant'

// Student pages
import StudentDashboard from '../pages/student/Dashboard'
import AttendanceView from '../pages/student/AttendanceView'
import Requests from '../pages/student/Requests'
import RequestCorrection from '../pages/student/RequestCorrection'
import StudentAI from '../pages/student/AIAssistant'

import ProtectedRoute from './ProtectedRoute'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/academics" element={<AdminAcademics />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/requests" element={<RequestsApproval />} />
          <Route path="/admin/profiles" element={<AdminProfiles />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/ai" element={<AdminAI />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
        </Route>
      </Route>

      {/* Staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/mark-attendance" element={<MarkAttendance />} />
          <Route path="/staff/classes" element={<ViewClasses />} />
          <Route path="/staff/absentees" element={<Absentees />} />
          <Route path="/staff/requests" element={<RequestsApproval />} />
          <Route path="/staff/ai" element={<StaffAI />} />
        </Route>
      </Route>

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<AttendanceView />} />
          <Route path="/student/requests" element={<Requests />} />
          <Route path="/student/request-correction" element={<RequestCorrection />} />
          <Route path="/student/ai" element={<StudentAI />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes