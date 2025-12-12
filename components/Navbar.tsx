// components/Navbar.tsx - MODERN VERSION WITH DARK MODE
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Dumbbell, LogOut, User, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <nav aria-label="Main navigation" className="glass sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="content-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group" aria-label="FitPro Academy home">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-cyan-500 p-2 rounded-lg sm:rounded-xl group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
            </div>
            <div>
              <span className="sr-only">FitPro Academy</span>
              <span className="hidden sm:inline text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                FitPro
              </span>
              <span className="sm:hidden text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                FP
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Academy</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {session ? (
              <>
                <Link href="/dashboard" className="nav-link flex items-center space-x-2 group">
                  <LayoutDashboard className="h-4 w-4 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/programs" className="nav-link group">
                  <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">Programs</span>
                </Link>
                {session.user.role === 'TRAINER' && (
                  <Link href="/trainer" className="nav-link group">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">Trainer Hub</span>
                  </Link>
                )}
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" className="nav-link group">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">Admin</span>
                  </Link>
                )}

                {/* Theme Toggle (removed from here so it can be shown to all users) */}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-500 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                      {session.user.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || 'Profile'}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{session.user.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div role="menu" aria-label="User menu" className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-10">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/programs" className="nav-link">
                  Programs
                </Link>
                <div className="flex items-center space-x-3">
                  <Link href="/auth/signin" className="nav-link">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-primary text-sm">
                    Get Started
                  </Link>
                </div>
              </>
            )}
            {/* Theme toggle visible to all users on desktop */}
            <ThemeToggle />
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900 dark:text-gray-100" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700">
            <div className="space-y-2">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-gray-900 dark:text-gray-100">Dashboard</span>
                  </Link>
                  <Link
                    href="/programs"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <span className="text-gray-900 dark:text-gray-100">Programs</span>
                  </Link>
                  {session.user.role === 'TRAINER' && (
                    <Link
                      href="/trainer"
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      <span className="text-gray-900 dark:text-gray-100">Trainer Hub</span>
                    </Link>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      <span className="text-gray-900 dark:text-gray-100">Admin Panel</span>
                    </Link>
                  )}
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800">
                    <p className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                    <p className="px-3 py-1 text-xs text-muted">{session.user.role}</p>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center w-full px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl mt-2"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="block p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-gray-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn-primary block text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}