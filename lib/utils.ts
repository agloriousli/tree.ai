import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let idCounter = 0
export function generateId(prefix: string = 'id'): string {
  idCounter++
  return `${prefix}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatTime(date: Date | string | number): string {
  // Handle different input types
  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    // Fallback to current time if invalid input
    dateObj = new Date()
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return '--:--'
  }
  
  const hours = dateObj.getHours().toString().padStart(2, '0')
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
