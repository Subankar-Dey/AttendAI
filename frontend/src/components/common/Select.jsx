import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  searchable = false,
  multiple = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = searchable && search
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedOption = multiple
    ? options.filter(opt => value?.includes(opt.value))
    : options.find(opt => opt.value === value)

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter(v => v !== option.value)
        : [...(value || []), option.value]
      onChange(newValue)
    } else {
      onChange(option.value)
      setIsOpen(false)
    }
    setSearch('')
  }

  const removeItem = (e, val) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== val))
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          w-full rounded-lg border bg-white px-3 py-2 text-sm
          cursor-pointer transition-all duration-200
          ${error
            ? 'border-danger-300 focus-within:ring-danger-200'
            : 'border-gray-300 focus-within:ring-primary-200'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-1">
            {multiple && selectedOption?.length > 0 ? (
              selectedOption.map(opt => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs"
                >
                  {opt.label}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-primary-600"
                    onClick={(e) => removeItem(e, opt.value)}
                  />
                </span>
              ))
            ) : !multiple && selectedOption ? (
              <span className="text-gray-900">{selectedOption.label}</span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {searchable && (
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multiple
                  ? value?.includes(option.value)
                  : value === option.value
                return (
                  <div
                    key={option.value}
                    className={`
                      px-3 py-2 text-sm cursor-pointer transition-colors
                      ${isSelected
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}
    </div>
  )
}

export default Select
