import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Response Utilities
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function createApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function createApiError(error: string, statusCode?: number): ApiResponse {
  return {
    success: false,
    error,
    message: error
  }
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Safe date formatting that handles null/undefined and invalid dates
export function formatDateSafe(date: Date | string | null | undefined, fallback: string = 'Unknown'): string {
  try {
    if (!date) return fallback
    
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('Invalid date provided to formatDateSafe:', date)
      return fallback
    }
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return fallback
  }
}

export function formatDateTimeSafe(date: Date | string | null | undefined, fallback: string = 'Unknown'): string {
  try {
    if (!date) return fallback
    
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('Invalid date provided to formatDateTimeSafe:', date)
      return fallback
    }
    
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return fallback
  }
}

// String utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateOrganizationSlug(companyName: string): string {
  const baseSlug = slugify(companyName)
  return baseSlug || 'organization'
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Object utilities
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

// Date utilities
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// String utilities
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const initials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// URL utilities
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// Production URL guard to prevent Vercel URLs in production
export const getProductionSafeBaseUrl = (): string => {
  // Force custom domain in production
  if (process.env.NODE_ENV === 'production') {
    // Always use custom domain if available
    if (process.env.NEXT_PUBLIC_APP_URL) {
      console.log('✅ Using custom domain from NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL
    }
    
    // Fallback to hardcoded custom domain for production
    console.log('⚠️ NEXT_PUBLIC_APP_URL not set, using hardcoded custom domain')
    return 'https://myceliumos.app'
  }
  
  // Development fallback
  const baseUrl = getBaseUrl()
  console.log('🔧 Development mode, using baseUrl:', baseUrl)
  return baseUrl
}

export const buildUrl = (path: string, params?: Record<string, string>): string => {
  const url = new URL(path, getBaseUrl())
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export const adjustColorBrightness = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const adjust = (color: number) => {
    const adjusted = Math.round(color * (100 + percent) / 100)
    return Math.max(0, Math.min(255, adjusted))
  }
  
  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
}

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  return imageExtensions.includes(getFileExtension(filename).toLowerCase())
}

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Validation utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const isValidHexColor = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

// Encryption utilities (for sensitive data)
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Organization utilities
export const getOrganizationInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Status utilities
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'approved':
      return 'text-success-600 bg-success-50'
    case 'pending':
    case 'in_progress':
    case 'review':
      return 'text-warning-600 bg-warning-50'
    case 'inactive':
    case 'overdue':
    case 'rejected':
      return 'text-error-600 bg-error-50'
    case 'draft':
    case 'not_started':
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// Notification utilities
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '✅'
    case 'warning':
      return '⚠️'
    case 'error':
      return '❌'
    case 'info':
      return 'ℹ️'
    default:
      return '📢'
  }
}

// PostgreSQL 42P05 Error handling utilities for API routes
export function isPreparedStatementError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || ''
  const errorCode = error.code || ''
  
  // PostgreSQL Error Code 42P05: "prepared statement already exists"
  return (
    errorCode === '42P05' ||
    errorMessage.includes('prepared statement') ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('d1') || // Common prepared statement names
    errorMessage.includes('d2') ||
    errorMessage.includes('ConnectionError') ||
    errorMessage.includes('Invalid \'prisma')
  )
}

// Enhanced API error response for connection issues
export function createConnectionErrorResponse(error: any): ApiResponse {
  if (isPreparedStatementError(error)) {
    return {
      success: false,
      error: 'Database connection temporarily unavailable',
      message: 'PostgreSQL prepared statement conflict detected - system is recovering automatically'
    }
  }
  
  // Generic connection error
  return {
    success: false,
    error: 'Database connection issue',
    message: 'Temporary connectivity problem - please try again in a moment'
  }
}

// Retry wrapper for database operations with 42P05 handling
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 100
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (isPreparedStatementError(error) && attempt < maxRetries) {
        console.log(`🔄 Attempt ${attempt}: PostgreSQL 42P05 error detected, retrying in ${delayMs}ms...`)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs))
        
        // Exponential backoff for subsequent retries
        delayMs *= 1.5
        continue
      }
      
      // Non-42P05 error or max retries exceeded
      throw error
    }
  }
  
  throw lastError
}

// Safe database operation wrapper for API routes
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await withDatabaseRetry(operation)
  } catch (error) {
    console.error('❌ Database operation failed:', error)
    
    if (isPreparedStatementError(error)) {
      console.error('🚨 PostgreSQL 42P05 prepared statement error detected')
    }
    
    return fallbackValue
  }
}