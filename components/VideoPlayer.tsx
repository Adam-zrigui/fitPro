// components/VideoCard.tsx
'use client'

import { useState } from 'react'
import { PlayCircle, Clock, Eye, ThumbsUp } from 'lucide-react'

interface VideoCardProps {
  title: string
  description?: string
  thumbnail?: string
  duration?: string
  views?: number
  likes?: number
  trainer?: {
    name: string
    avatar?: string
  }
  onClick?: () => void
  className?: string
}

export default function VideoCard({
  title,
  description,
  thumbnail,
  duration = '0:00',
  views = 0,
  likes = 0,
  trainer,
  onClick,
  className = ''
}: VideoCardProps) {
  const [hovered, setHovered] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div
      className={`card card-hover overflow-hidden cursor-pointer ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Video Thumbnail */}
      <div className="relative h-48 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              hovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-white/60" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full">
            <PlayCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
          <Clock className="h-3 w-3 inline mr-1" />
          {duration}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-2">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
        
        {description && (
          <p className="text-secondary text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{formatNumber(views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{formatNumber(likes)}</span>
            </div>
          </div>
        </div>
        
        {/* Trainer Info */}
        {trainer && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center text-white font-bold">
              {trainer.avatar ? (
                <img src={trainer.avatar} alt={trainer.name} className="w-full h-full rounded-full" />
              ) : (
                trainer.name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{trainer.name}</p>
              <p className="text-xs text-muted">Certified Trainer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}