// Service Type Color Management Utilities

// Default color palette for service types
export const DEFAULT_SERVICE_COLORS = {
  'social-media-management': '#3B82F6', // Blue
  'website-design': '#8B5CF6', // Purple
  'seo-services': '#F59E0B', // Orange
  'content-writing': '#EF4444', // Red
  'brand-identity': '#EC4899', // Pink
  'video-production': '#06B6D4', // Cyan
  'photography': '#84CC16', // Lime
  'digital-marketing': '#F97316', // Orange-600
  'email-marketing': '#10B981', // Emerald
  'ppc-advertising': '#6366F1', // Indigo
  'analytics-reporting': '#8B5CF6', // Purple-500
  'consulting': '#64748B', // Slate
  'web-development': '#059669', // Emerald-600
  'mobile-app-design': '#7C3AED', // Violet
  'e-commerce-setup': '#DC2626', // Red-600
  'maintenance': '#6B7280', // Gray-500
  'training': '#0EA5E9', // Sky
  'strategy-planning': '#7C2D12', // Red-800
  'copywriting': '#BE185D', // Pink-700
  'graphic-design': '#9333EA' // Purple-600
}

// Accessible color palette with good contrast ratios
export const ACCESSIBLE_COLOR_PALETTE = [
  { name: 'Blue', value: '#3B82F6', contrast: 'white' },
  { name: 'Purple', value: '#8B5CF6', contrast: 'white' },
  { name: 'Orange', value: '#F59E0B', contrast: 'black' },
  { name: 'Red', value: '#EF4444', contrast: 'white' },
  { name: 'Pink', value: '#EC4899', contrast: 'white' },
  { name: 'Cyan', value: '#06B6D4', contrast: 'white' },
  { name: 'Lime', value: '#84CC16', contrast: 'black' },
  { name: 'Emerald', value: '#10B981', contrast: 'white' },
  { name: 'Indigo', value: '#6366F1', contrast: 'white' },
  { name: 'Slate', value: '#64748B', contrast: 'white' },
  { name: 'Violet', value: '#7C3AED', contrast: 'white' },
  { name: 'Sky', value: '#0EA5E9', contrast: 'white' },
  { name: 'Rose', value: '#F43F5E', contrast: 'white' },
  { name: 'Amber', value: '#FBBF24', contrast: 'black' },
  { name: 'Teal', value: '#14B8A6', contrast: 'white' },
  { name: 'Fuchsia', value: '#D946EF', contrast: 'white' }
]

// Generate default color for a service type based on its name
export function getDefaultColorForService(serviceName: string): string {
  const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  // Check if we have a specific default for this service
  if (DEFAULT_SERVICE_COLORS[slug as keyof typeof DEFAULT_SERVICE_COLORS]) {
    return DEFAULT_SERVICE_COLORS[slug as keyof typeof DEFAULT_SERVICE_COLORS]
  }
  
  // Generate a consistent color based on the service name hash
  let hash = 0
  for (let i = 0; i < serviceName.length; i++) {
    hash = serviceName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % ACCESSIBLE_COLOR_PALETTE.length
  return ACCESSIBLE_COLOR_PALETTE[index].value
}

// Calculate color contrast ratio
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

// Validate color accessibility
export function validateColorAccessibility(color: string): {
  isValid: boolean
  contrastWithWhite: number
  contrastWithBlack: number
  recommendedTextColor: 'white' | 'black'
  warnings: string[]
} {
  const contrastWithWhite = getContrastRatio(color, '#FFFFFF')
  const contrastWithBlack = getContrastRatio(color, '#000000')
  const recommendedTextColor = contrastWithWhite > contrastWithBlack ? 'white' : 'black'
  
  const warnings: string[] = []
  
  // WCAG AA standard requires 4.5:1 for normal text, 3:1 for large text
  const minContrast = Math.max(contrastWithWhite, contrastWithBlack)
  
  if (minContrast < 3) {
    warnings.push('Color may be difficult to read - consider a darker or lighter shade')
  } else if (minContrast < 4.5) {
    warnings.push('Color meets minimum accessibility but could be improved')
  }
  
  return {
    isValid: minContrast >= 3,
    contrastWithWhite,
    contrastWithBlack,
    recommendedTextColor,
    warnings
  }
}

// Convert hex color to HSL for better color manipulation
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  
  const { r, g, b } = rgb
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break
      case gNorm: h = (bNorm - rNorm) / d + 2; break
      case bNorm: h = (rNorm - gNorm) / d + 4; break
      default: h = 0
    }
    h /= 6
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Generate Tailwind CSS classes for service type colors
export function getServiceTypeColorClasses(color: string): {
  background: string
  text: string
  border: string
  hover: string
} {
  // For custom colors, we'll use inline styles, but provide fallback classes
  const accessibility = validateColorAccessibility(color)
  
  return {
    background: `bg-[${color}]`,
    text: accessibility.recommendedTextColor === 'white' ? 'text-white' : 'text-black',
    border: `border-[${color}]`,
    hover: `hover:bg-[${color}]/80`
  }
}

// Check if two colors are too similar
export function areColorsTooSimilar(color1: string, color2: string, threshold = 30): boolean {
  const hsl1 = hexToHsl(color1)
  const hsl2 = hexToHsl(color2)
  
  if (!hsl1 || !hsl2) return false
  
  const hueDiff = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h))
  const satDiff = Math.abs(hsl1.s - hsl2.s)
  const lightDiff = Math.abs(hsl1.l - hsl2.l)
  
  // Colors are too similar if they're close in hue, saturation, and lightness
  return hueDiff < threshold && satDiff < 20 && lightDiff < 20
}

// Suggest alternative colors if the selected one conflicts with existing ones
export function suggestAlternativeColors(selectedColor: string, existingColors: string[]): string[] {
  const alternatives: string[] = []
  
  for (const paletteColor of ACCESSIBLE_COLOR_PALETTE) {
    const isConflicting = existingColors.some(existing => 
      areColorsTooSimilar(paletteColor.value, existing) || 
      areColorsTooSimilar(paletteColor.value, selectedColor)
    )
    
    if (!isConflicting && paletteColor.value !== selectedColor) {
      alternatives.push(paletteColor.value)
    }
  }
  
  return alternatives.slice(0, 5) // Return top 5 alternatives
} 