import { useState, useEffect } from 'react'
import { attendanceService } from '../services/attendanceService'

export const useAttendance = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const markAttendance = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const response = await attendanceService.mark(data)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAbsentees = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await attendanceService.getAbsentees()
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch absentees')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, markAttendance, getAbsentees }
}

export default useAttendance