import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

// Create a client
const queryClient = new QueryClient()

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/register']

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Check if route requires authentication
    if (!publicRoutes.includes(router.pathname)) {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
      }
    }
  }, [router.pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
} 