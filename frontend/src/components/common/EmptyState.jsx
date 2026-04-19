import { FileText, Search, Inbox, Users, Calendar } from 'lucide-react'

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  const defaultIcons = {
    search: Search,
    file: FileText,
    inbox: Inbox,
    users: Users,
    calendar: Calendar,
  }

  const IconComponent = Icon || defaultIcons.file

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <IconComponent size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
