import Link from 'next/link'
import { Clock, Users, BarChart3, Lock } from 'lucide-react'

interface ProgramCardProps {
  program: {
    id: string
    title: string
    description: string
    duration: number
    level: string
    imageUrl?: string | null
    trainer: {
      name: string | null
    }
    _count?: {
      enrollments: number
    }
  }
}

export default function ProgramCard({ program }: ProgramCardProps) {
  // Generate consistent color gradients based on program level
  const getGradient = (level: string) => {
    switch(level) {
      case 'Beginner':
        return 'from-green-400 via-emerald-500 to-teal-600 dark:from-green-600 dark:via-emerald-700 dark:to-teal-800'
      case 'Intermediate':
        return 'from-orange-400 via-amber-500 to-yellow-600 dark:from-orange-600 dark:via-amber-700 dark:to-yellow-800'
      case 'Advanced':
        return 'from-red-400 via-pink-500 to-purple-600 dark:from-red-600 dark:via-pink-700 dark:to-purple-800'
      default:
        return 'from-blue-400 via-purple-500 to-pink-600 dark:from-blue-600 dark:via-purple-700 dark:to-pink-800'
    }
  }

  const getEmoji = (level: string) => {
    switch(level) {
      case 'Beginner': return '🌱'
      case 'Intermediate': return '🔥'
      case 'Advanced': return '⚡'
      default: return '💪'
    }
  }

  return (
    <div className="card hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group hover-pop animate-fade-in-up">
      <div className={`relative h-52 bg-gradient-to-br ${getGradient(program.level)} rounded-lg mb-4 flex items-center justify-center overflow-hidden`}>
        {program.imageUrl ? (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <img
              src={program.imageUrl}
              alt={program.title}
              className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-400" />
          </div>
        ) : (
          <>
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-5 right-5 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse-slow"></div>
              <div className="absolute bottom-5 left-5 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            </div>
            
            {/* Content */}
            <div className="relative text-center z-10">
              <div className="text-7xl mb-2 group-hover:scale-110 transition-transform duration-300 animate-pop">{getEmoji(program.level)}</div>
              <p className="text-white/90 text-sm font-semibold tracking-wide">{program.level}</p>
            </div>
          </>
        )}
      </div>
      
      <div className="mb-3">
        <span className={`badge ${
          program.level === 'Beginner' ? 'badge-success' :
          program.level === 'Intermediate' ? 'badge-warning' :
          'badge-info'
        }`}>
          {program.level}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">{program.title}</h3>
      <p className="text-secondary text-sm mb-4 line-clamp-2">{program.description}</p>

      <div className="flex items-center gap-4 text-sm text-secondary mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-1 flex-1">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">{program.duration} weeks</span>
        </div>
        {program._count && (
          <div className="flex items-center gap-1 flex-1">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">{program._count.enrollments}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-secondary uppercase tracking-wider font-semibold">by</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{program.trainer.name}</p>
        </div>
        <Link 
          href={`/programs/${program.id}`}
          className="btn-primary py-2 px-4 text-sm"
        >
          View
        </Link>
      </div>
    </div>
  )
}
