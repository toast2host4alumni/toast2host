'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const client = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'inherit',
          },
          classNames: {
            success: 'bg-success text-success-foreground',
            error: 'bg-error text-error-foreground',
          },
        }}
      />
    </QueryClientProvider>
  )
}

