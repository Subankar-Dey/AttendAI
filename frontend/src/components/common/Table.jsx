import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  sortColumn,
  sortDirection,
  onSort,
  pagination,
  onPageChange,
  onLimitChange,
  rowClassName,
  onRowClick,
}) => {
  const [localSortColumn, setLocalSortColumn] = useState(null)
  const [localSortDirection, setLocalSortDirection] = useState('asc')

  const currentSortColumn = sortColumn ?? localSortColumn
  const currentSortDirection = sortDirection ?? localSortDirection

  const handleSort = (column) => {
    if (!column.sortable) return

    const newDirection =
      currentSortColumn === column.accessor
        ? currentSortDirection === 'asc'
          ? 'desc'
          : 'asc'
        : 'asc'

    setLocalSortColumn(column.accessor)
    setLocalSortDirection(newDirection)
    onSort?.(column.accessor, newDirection)
  }

  const renderSortIcon = (column) => {
    if (!column.sortable) return null

    if (currentSortColumn === column.accessor) {
      return currentSortDirection === 'asc' ? (
        <ChevronUp size={16} className="text-primary-600" />
      ) : (
        <ChevronDown size={16} className="text-primary-600" />
      )
    }

    return (
      <div className="w-4 h-4 opacity-30">
        <ChevronUp size={16} />
      </div>
    )
  }

  const renderCellContent = (column, row) => {
    if (column.render) {
      return column.render(row[column.accessor], row)
    }
    return row[column.accessor]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b border-gray-200" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`
                    px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr
                key={row._id || rowIndex}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowClassName ? rowClassName(row) : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-6 py-4 text-sm text-gray-700"
                  >
                    {renderCellContent(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} entries
            </div>
            <div className="flex items-center gap-4">
              <select
                value={pagination.limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {[10, 20, 50, 100].map((limit) => (
                  <option key={limit} value={limit}>
                    {limit} per page
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
