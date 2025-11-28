import { useState, useRef, useEffect } from 'react'

type CountryCode = {
  value: string
  label: string
}

interface CountrySelectProps {
  value: string
  options: CountryCode[]
  onChange: (value: string) => void
  disabled?: boolean
}

const CountrySelect = ({ value, options, onChange, disabled }: CountrySelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse the selected option to get just flag + code with extra spacing
  const selectedOption = options.find((opt) => opt.value === value)
  const flag = selectedOption ? selectedOption.label.split(' ')[0] : ''
  const code = selectedOption ? selectedOption.value.replace('-CAN', '') : value
  const displayValue = selectedOption ? `${flag}  ${code}` : value

  // Sort options: USA first, then alphabetical by label (ISO code)
  const sortedOptions = [...options].sort((a, b) => {
    if (a.value === '+1' && !a.value.includes('CAN')) return -1
    if (b.value === '+1' && !b.value.includes('CAN')) return 1
    return a.label.localeCompare(b.label)
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="country-select-container" ref={dropdownRef}>
      <button
        type="button"
        className="country-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {displayValue}
      </button>
      {isOpen && (
        <div className="country-select-dropdown">
          {sortedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="country-select-option"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CountrySelect
