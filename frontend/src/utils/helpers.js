import { ROLES } from './roleHelpers'

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getSeverityColor = (percentage) => {
  if (percentage === null || percentage === undefined) return 'text-gray-600 bg-gray-100'
  if (percentage < 50) return 'text-red-600 bg-red-100'
  if (percentage < 65) return 'text-orange-600 bg-orange-100'
  if (percentage < 75) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}

export const getSeverityLevel = (percentage) => {
  if (percentage === null || percentage === undefined) return 'unknown'
  if (percentage < 50) return 'critical'
  if (percentage < 65) return 'high'
  if (percentage < 75) return 'warning'
  return 'normal'
}

export const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0
  return Math.round((present / total) * 100)
}

export const getRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncate = (str, maxLength = 50) => {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

export const generatePagination = (currentPage, totalPages, maxVisible = 5) => {
  const pages = []
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return { pages, startPage, endPage }
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.ADMIN: return 'bg-purple-100 text-purple-800'
    case ROLES.STAFF: return 'bg-blue-100 text-blue-800'
    case ROLES.STUDENT: return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'present': return 'bg-green-100 text-green-800'
    case 'absent': return 'bg-red-100 text-red-800'
    case 'late': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
