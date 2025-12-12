'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteProgramButton({ programId }: { programId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const ok = confirm('Are you sure you want to permanently delete this program? This cannot be undone.')
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      // Redirect to trainer programs list
      router.push('/trainer/programs')
    } catch (err) {
      console.error(err)
      alert('Failed to delete program')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn w-full mt-2 bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600"
    >
      {loading ? 'Deleting...' : 'Delete Program'}
    </button>
  )
}
