import api from './api'

export const attendanceService = {
  mark: async (data) => {
    const response = await api.post('/attendance/mark', data)
    return response.data
  },

  markBulk: async (attendanceList) => {
    const response = await api.post('/attendance/mark-bulk', { attendanceList })
    return response.data
  },

  getRecords: async (params = {}) => {
    const response = await api.get('/attendance', { params })
    return response.data
  },

  getByStudent: async (studentId, params = {}) => {
    const response = await api.get(`/attendance/student/${studentId}`, { params })
    return response.data
  },

  getByClass: async (classId, params = {}) => {
    const response = await api.get(`/attendance/class/${classId}`, { params })
    return response.data
  },

  getAbsentees: async (params = {}) => {
    const response = await api.get('/attendance/absent', { params })
    return response.data
  },

  getLowAttendance: async (threshold = 75) => {
    const response = await api.get('/attendance/low-attendance', {
      params: { threshold },
    })
    return response.data
  },

  getLogs: async (params = {}) => {
    const response = await api.get('/attendance/logs', { params })
    return response.data
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/attendance/${id}`, { status })
    return response.data
  },

  requestCorrection: async (attendanceId, reason) => {
    const response = await api.post('/attendance/correction-request', {
      attendanceId,
      reason,
    })
    return response.data
  },
}

export default attendanceService
