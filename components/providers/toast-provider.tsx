'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  )
}
