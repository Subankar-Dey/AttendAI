import api from './api'

export const aiService = {
  chat: async (message, role) => {
    const response = await api.post('/ai/chat', { message, role })
    return response.data
  },

  predict: async (studentId) => {
    const response = await api.post('/ai/predict', { studentId })
    return response.data
  },

  analyzeAnomalies: async (params = {}) => {
    const response = await api.post('/ai/analyze', params)
    return response.data
  },

  generateTimetable: async (classId, constraints) => {
    const response = await api.post('/ai/generate-timetable', { classId, constraints })
    return response.data
  },

  ocrTimetable: async (imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await api.post('/ai/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getAtRiskStudents: async (params = {}) => {
    const response = await api.get('/ai/at-risk', { params })
    return response.data
  },

  suggestAttendance: async (classId, date) => {
    const response = await api.post('/ai/suggest-attendance', { classId, date })
    return response.data
  },
}

export default aiService
