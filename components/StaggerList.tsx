import React from 'react'

type StaggerListProps = {
  children: React.ReactNode
  staggerMs?: number
  animationClass?: string
  className?: string
}

export default function StaggerList({ children, staggerMs = 80, animationClass = 'animate-fade-in-up', className = '' }: StaggerListProps) {
  const items = React.Children.toArray(children)

  // Respect reduced motion: if user prefers reduced motion, don't add delays
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className={className}>
      {items.map((child, i) => {
        if (!React.isValidElement(child)) return child
        const delayStyle: React.CSSProperties = prefersReduced ? {} : { animationDelay: `${i * staggerMs}ms` }
        const existingClass = (child.props && child.props.className) || ''
        const mergedClass = `${existingClass} ${animationClass}`.trim()

        return React.cloneElement(child as React.ReactElement, {
          key: (child as any).key || i,
          style: { ...(child as any).props.style, ...delayStyle },
          className: mergedClass,
        })
      })}
    </div>
  )
}
