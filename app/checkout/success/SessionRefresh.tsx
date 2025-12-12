'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SessionRefreshOnSuccess() {
  const { update } = useSession()

  useEffect(() => {
    // Wait 2 seconds for webhook to complete, then refresh session
    const timer = setTimeout(async () => {
      try {
        await update()
        console.log('✅ Session refreshed after checkout')
      } catch (err) {
        console.error('Failed to refresh session:', err)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [update])

  return null
}
