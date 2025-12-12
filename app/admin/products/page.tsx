import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import ProductsManager from '@/components/ProductsManager'
import { Settings } from 'lucide-react'

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions)

  // Check if user is admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-blue-700 dark:to-cyan-700 p-3 rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Subscription Management</h1>
              <p className="text-secondary mt-1">Create and manage Stripe subscription products</p>
            </div>
          </div>
        </div>

        {/* Products Manager Component */}
        <ProductsManager />
      </main>
    </div>
  )
}
