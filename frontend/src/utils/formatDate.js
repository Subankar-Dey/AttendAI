export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getSeverityColor = (percentage) => {
  if (percentage < 50) return 'text-red-600 bg-red-100'
  if (percentage < 65) return 'text-orange-600 bg-orange-100'
  if (percentage < 75) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}