import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="card bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-800 dark:to-cyan-700 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold">Unlock expert-led programs</h3>
          <p className="text-blue-100 dark:text-blue-200 mt-2">Explore curated programs with video demos, progress tracking, and trainer support.</p>
        </div>

        <div className="flex-shrink-0">
          <Link href="/programs" className="btn-primary inline-flex items-center justify-center px-6 py-3">
            Explore Programs
          </Link>
        </div>
      </div>
    </section>
  )
}
