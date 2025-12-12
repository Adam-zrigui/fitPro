"use client"

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 bg-gradient-to-t from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="content-container py-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="text-2xl">🏋️‍♀️</div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">FitPro Academy</span>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">© {new Date().getFullYear()} FitPro Academy. All rights reserved.</div>
      </div>
    </footer>
  )
}
