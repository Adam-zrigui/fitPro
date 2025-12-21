'use client'

import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

export default function SMGInsane() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate particles
    const generateParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1
        })
      }
      setParticles(newParticles)
    }

    generateParticles()

    // Animate particles
    const animateParticles = () => {
      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          y: particle.y - particle.speed * 0.1,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.1,
          opacity: particle.opacity + Math.sin(Date.now() * 0.002 + particle.id) * 0.1
        })).filter(particle => particle.y > -10)
      )
    }

    const interval = setInterval(animateParticles, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient Waves */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-cyan-50/30 dark:from-blue-900/10 dark:via-purple-900/5 dark:to-cyan-900/10 animate-pulse" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 dark:from-blue-800/10 dark:to-purple-800/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 dark:from-cyan-800/10 dark:to-blue-800/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-200/15 to-pink-200/15 dark:from-purple-800/8 dark:to-pink-800/8 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/40 to-purple-400/40 dark:from-blue-300/30 dark:to-purple-300/30 blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%)`,
              transition: 'all 0.1s ease-out'
            }}
          />
        ))}
      </div>

      {/* Subtle Wave Animation */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/10 to-transparent dark:from-gray-900/10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-blue-50/20 to-transparent dark:from-blue-900/5 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  )
}
