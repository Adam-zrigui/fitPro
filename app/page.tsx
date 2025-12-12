import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, Award, Star } from 'lucide-react'
import SMGBanner from '@/components/SMGBanner'
import StaggerList from '@/components/StaggerList'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-gray-50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-cyan-200/20 dark:from-slate-900/20 dark:to-slate-800/15" />
        <div className="relative content-container min-h-[64vh] flex items-center py-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mx-2 md:mx-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 leading-tight">
                  <span className="block text-gray-900 dark:text-white">Train Smarter,</span>
                  <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">Get Stronger — For Life</span>
                </h1>

                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-4">
                  Curated programs, step-by-step video guidance, and progress tracking designed for real results.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-3">
                  <Link href="/programs" className="btn-primary inline-flex items-center px-5 py-2 text-sm sm:text-base shadow-md hover:shadow-lg w-full sm:w-auto justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Explore Programs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/auth/signup" className="btn-secondary inline-flex items-center px-5 py-2 text-sm sm:text-base shadow-sm hover:shadow-md w-full sm:w-auto justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400">
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Stats */}
      <section className="content-container -mt-12 mb-12">
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" staggerMs={80} animationClass="animate-fade-in">
            {[
              { title: 'Growing Community', subtitle: 'Join early adopters and active learners', icon: Users },
              { title: 'Expert Coaches', subtitle: 'Certified trainers who design practical programs', icon: Star },
              { title: 'Programs', subtitle: 'Structured paths for strength, mobility, and conditioning', icon: Award },
              { title: 'Satisfaction', subtitle: 'Members report consistent progress and improved habits', icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="stat-card p-8 flex flex-col items-center justify-center text-center hover:shadow-lg dark:hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="rounded-full p-4 mb-4 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-white shadow-md ring-1 ring-slate-50/40 dark:ring-0">
                  <s.icon className="h-10 sm:h-12 w-10 sm:w-12" />
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{s.title}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-2">{s.subtitle}</div>
              </div>
            ))}
        </StaggerList>
      </section>

      {/* SMG Banner (hero-like) */}
      <SMGBanner />

      {/* Features */}
      <section id="features" className="content-container py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Why FitPro Academy?</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">Programs built around real outcomes — strength, mobility, and sustainable habit change.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="card p-6 flex flex-col hover:shadow-lg dark:hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold text-lg sm:text-xl mb-2 text-gray-900 dark:text-white">Goal-driven programs</h3>
            <p className="text-gray-600 dark:text-gray-400 flex-1 text-sm sm:text-base">Targeted workouts for strength, conditioning, mobility, and athletic performance.</p>
          </div>

          <div className="card p-6 flex flex-col hover:shadow-lg dark:hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="font-semibold text-lg sm:text-xl mb-2 text-gray-900 dark:text-white">Video-first coaching</h3>
            <p className="text-gray-600 dark:text-gray-400 flex-1 text-sm sm:text-base">High-quality demonstrations and cues so you train with confidence.</p>
          </div>

          <div className="card p-6 flex flex-col hover:shadow-lg dark:hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">Track & improve</h3>
            <p className="text-gray-600 dark:text-gray-400 text-base flex-1">Progress tools and analytics to keep you accountable.</p>
          </div>
        </div>
      </section>

      {/* Testimonials / Feedback */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 dark:bg-gradient-to-r dark:from-slate-900/60 dark:to-slate-800/30 py-16">
        <div className="content-container text-center">
          <h3 className="text-2xl font-bold mb-6">Feedback from early users</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-left hover:shadow-lg dark:hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700">
              <p className="mb-4 text-gray-900 dark:text-gray-100">“The program structure finally made consistency simple — I actually stick to my plan now.”</p>
              <div className="text-sm text-gray-600 dark:text-gray-400">— Sam, early user</div>
            </div>
            <div className="card p-6 text-left hover:shadow-lg dark:hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700">
              <p className="mb-4 text-gray-900 dark:text-gray-100">“Clear video cues fixed my form and helped me train without nagging aches.”</p>
              <div className="text-sm text-gray-600 dark:text-gray-400">— Priya, beta tester</div>
            </div>
            <div className="card p-6 text-left hover:shadow-lg dark:hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700">
              <p className="mb-4 text-gray-900 dark:text-gray-100">“Coaches are attentive and the progress tracking keeps me motivated every week.”</p>
              <div className="text-sm text-gray-600 dark:text-gray-400">— Marco, trial participant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer moved to layout */}
    </div>
  )
}
