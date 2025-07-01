'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ACCESSIBLE_COLOR_PALETTE, 
  validateColorAccessibility, 
  areColorsTooSimilar,
  suggestAlternativeColors 
} from '@/lib/service-colors'
import { 
  Palette, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Lightbulb
} from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  existingColors?: string[]
  label?: string
  placeholder?: string
  className?: string
}

export default function ColorPicker({ 
  value, 
  onChange, 
  existingColors = [], 
  label = "Color",
  placeholder = "#10B981",
  className = ""
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)
  const [accessibility, setAccessibility] = useState(validateColorAccessibility(value))
  const pickerRef = useRef<HTMLDivElement>(null)

  // Update accessibility validation when color changes
  useEffect(() => {
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      setAccessibility(validateColorAccessibility(customColor))
    }
  }, [customColor])

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePaletteColorSelect = (color: string) => {
    setCustomColor(color)
    onChange(color)
    setIsOpen(false)
  }

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor)
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor)
    }
  }

  const handleCustomColorBlur = () => {
    if (!customColor.startsWith('#')) {
      const formattedColor = `#${customColor}`
      setCustomColor(formattedColor)
      if (/^#[0-9A-F]{6}$/i.test(formattedColor)) {
        onChange(formattedColor)
      }
    }
  }

  // Check for color conflicts
  const hasConflicts = existingColors.some(existing => 
    existing !== value && areColorsTooSimilar(value, existing)
  )

  const suggestions = hasConflicts ? suggestAlternativeColors(value, existingColors) : []

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Color Preview & Trigger */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-16 h-10 p-1 border-2"
            style={{ borderColor: value }}
          >
            <div 
              className="w-full h-full rounded"
              style={{ backgroundColor: value }}
            />
          </Button>
          
          <Input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            onBlur={handleCustomColorBlur}
            placeholder={placeholder}
            className="flex-1 font-mono text-sm"
            maxLength={7}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>

        {/* Color Validation Feedback */}
        <div className="mt-2 space-y-1">
          {accessibility.warnings.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                {accessibility.warnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </div>
            </div>
          )}
          
          {accessibility.isValid && accessibility.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Good accessibility - readable on {accessibility.recommendedTextColor} text</span>
            </div>
          )}

          {hasConflicts && (
            <div className="flex items-start gap-2 text-xs text-orange-600">
              <Eye className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Similar to existing service type colors - consider choosing a different shade</span>
            </div>
          )}
        </div>

        {/* Color Suggestions for Conflicts */}
        {suggestions.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Lightbulb className="h-3 w-3" />
              <span>Suggested alternatives:</span>
            </div>
            <div className="flex gap-1">
              {suggestions.map((suggestedColor, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePaletteColorSelect(suggestedColor)}
                  className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: suggestedColor }}
                  title={`Click to use ${suggestedColor}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Color Palette Popup */}
        {isOpen && (
          <div 
            ref={pickerRef}
            className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
          >
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Choose a color</h4>
              
              {/* Accessible Color Palette */}
              <div className="grid grid-cols-8 gap-2">
                {ACCESSIBLE_COLOR_PALETTE.map((color) => {
                  const isSelected = color.value === value
                  const isConflicting = existingColors.some(existing => 
                    existing !== value && areColorsTooSimilar(color.value, existing)
                  )
                  
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handlePaletteColorSelect(color.value)}
                      className={`
                        relative w-8 h-8 rounded border-2 transition-all hover:scale-110
                        ${isSelected 
                          ? 'border-gray-900 ring-2 ring-blue-500 ring-offset-1' 
                          : 'border-gray-200 hover:border-gray-400'
                        }
                        ${isConflicting ? 'opacity-50' : ''}
                      `}
                      style={{ backgroundColor: color.value }}
                      title={`${color.name} ${isConflicting ? '(similar to existing)' : ''}`}
                    >
                      {isSelected && (
                        <CheckCircle 
                          className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" 
                        />
                      )}
                      {isConflicting && !isSelected && (
                        <AlertTriangle 
                          className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 bg-white rounded-full" 
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Custom Color (Hex)
              </label>
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                onBlur={handleCustomColorBlur}
                placeholder="#10B981"
                className="text-xs font-mono"
                maxLength={7}
              />
            </div>

            {/* Accessibility Info */}
            <div className="mt-3 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Contrast with white:</span>
                <span className={accessibility.contrastWithWhite >= 4.5 ? 'text-green-600' : 'text-orange-600'}>
                  {accessibility.contrastWithWhite.toFixed(1)}:1
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Contrast with black:</span>
                <span className={accessibility.contrastWithBlack >= 4.5 ? 'text-green-600' : 'text-orange-600'}>
                  {accessibility.contrastWithBlack.toFixed(1)}:1
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 