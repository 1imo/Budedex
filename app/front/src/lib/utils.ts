import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Temporary fix for stack overflow - just use clsx without twMerge
  return clsx(inputs)
}

