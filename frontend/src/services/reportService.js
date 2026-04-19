import api from './api'

export const reportService = {
  getDaily: async (date) => {
    const response = await api.get('/reports/daily', { params: { date } })
    return response.data
  },

  getMonthly: async (month, year) => {
    const response = await api.get('/reports/monthly', { params: { month, year } })
    return response.data
  },

  getClassReport: async (classId, params = {}) => {
    const response = await api.get(`/reports/class/${classId}`, { params })
    return response.data
  },

  getStaffReport: async (staffId, params = {}) => {
    const response = await api.get(`/reports/staff/${staffId}`, { params })
    return response.data
  },

  exportPDF: async (reportType, params = {}) => {
    const response = await api.get(`/reports/export/pdf/${reportType}`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  exportExcel: async (reportType, params = {}) => {
    const response = await api.get(`/reports/export/excel/${reportType}`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  getSummary: async () => {
    const response = await api.get('/reports/summary')
    return response.data
  },
}

export default reportService
