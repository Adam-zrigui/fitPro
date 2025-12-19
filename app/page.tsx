import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, Award, Star, Dumbbell, PlayCircle, Target, Heart, Zap } from 'lucide-react'
import SMGInsane from '@/components/SMGInsane'
import StaggerList from '@/components/StaggerList'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20 lg:py-32">
        <div className="content-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Learn from the <span className="text-blue-600 dark:text-blue-400">best fitness</span> trainers in the world
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mt-6 leading-relaxed">
                  Join millions of learners and transform your body with expert-led fitness programs. Master strength training, cardio, yoga, and more with personalized guidance from certified professionals.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/programs" className="btn-primary inline-flex items-center px-8 py-4 text-lg font-semibold">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Browse Programs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/auth/signup" className="btn-secondary inline-flex items-center px-8 py-4 text-lg font-semibold">
                  Join for Free
                </Link>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>1,000+ learners enrolled</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  <span>4.8/5 average rating</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform">
                <img src="/uploads/gym-hero.jpg" alt="Fitness training" className="w-full h-64 object-cover rounded-xl" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="content-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose your fitness path
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore programs designed for every fitness level and goal
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Strength Training',
                description: 'Build muscle and power with progressive resistance training',
                icon: Dumbbell,
                color: 'from-red-500 to-pink-500',
                programs: '25 programs'
              },
              {
                title: 'Cardio & HIIT',
                description: 'Boost endurance and burn fat with high-intensity workouts',
                icon: Heart,
                color: 'from-orange-500 to-red-500',
                programs: '18 programs'
              },
              {
                title: 'Yoga & Flexibility',
                description: 'Improve mobility and find balance with mindful movement',
                icon: Target,
                color: 'from-green-500 to-teal-500',
                programs: '15 programs'
              },
              {
                title: 'Sports Performance',
                description: 'Enhance athletic performance with sport-specific training',
                icon: Zap,
                color: 'from-blue-500 to-purple-500',
                programs: '12 programs'
              }
            ].map((category, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 group cursor-pointer">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{category.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">{category.description}</p>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{category.programs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Tiers Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="content-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose your subscription tier
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Flexible monthly and yearly plans for every fitness journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Monthly Plan</h3>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">$29<span className="text-lg font-normal">/month</span></div>
                <p className="text-gray-600 dark:text-gray-400">Perfect for trying out programs</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Access to all fitness programs</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">HD video demonstrations</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Progress tracking</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Cancel anytime</span>
                </li>
              </ul>
              <Link href="/auth/signup?plan=monthly" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center block transition-colors">
                Start Monthly Plan
              </Link>
            </div>

            {/* Yearly Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white relative">
              <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                SAVE 25%
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Yearly Plan</h3>
                <div className="text-4xl font-bold mb-1">$249<span className="text-lg font-normal">/year</span></div>
                <p className="text-blue-100">$20.75/month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">Everything in Monthly</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">25% savings vs monthly</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">Exclusive content access</span>
                </li>
              </ul>
              <Link href="/auth/signup?plan=yearly" className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg text-center block hover:bg-gray-100 transition-colors">
                Start Yearly Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700 text-white">
        <div className="content-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Join a global fitness community
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Millions of learners worldwide are transforming their lives with our expert-led programs
            </p>
          </div>
          <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-8" staggerMs={100} animationClass="animate-fade-in-up">
            {[
              { title: '1,000+', subtitle: 'Active Learners', icon: Users },
              { title: '500+', subtitle: 'Video Lessons', icon: PlayCircle },
              { title: '50+', subtitle: 'Expert Trainers', icon: Award },
              { title: '4.8/5', subtitle: 'Average Rating', icon: Star },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                <div className="text-4xl font-bold mb-2">{stat.title}</div>
                <div className="text-blue-100">{stat.subtitle}</div>
              </div>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white text-center">
        <div className="content-container">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Start your fitness journey today
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-300 leading-relaxed">
            Join thousands of successful graduates who have transformed their bodies and lives. Get access to world-class training programs, expert guidance, and a supportive community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup" className="inline-flex items-center px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              Start Learning Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
            <Link href="/programs" className="inline-flex items-center px-10 py-4 bg-white text-gray-900 font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              Browse Programs
            </Link>
          </div>
          <p className="text-gray-400">✓ No credit card required ✓ Cancel anytime ✓ 30-day money-back guarantee</p>
        </div>
      </section>
    </div>
  )
}
