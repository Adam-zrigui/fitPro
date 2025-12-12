import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'primary' | 'green' | 'orange' | 'purple'
}

export default function StatsCard({ title, value, icon: Icon, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-full`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
