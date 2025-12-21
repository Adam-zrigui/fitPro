import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, Award, Star, Dumbbell, PlayCircle, Target, Heart, Zap, CheckCircle, Sparkles, Crown, Shield } from 'lucide-react'
import SMGInsane from '@/components/SMGInsane'
import StaggerList from '@/components/StaggerList'
import SubscriptionButton from '@/components/SubscriptionButton'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Exclusive Fitness Experience</span>
              </div>

              <div>
                <h1 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                  Transform Your Body with
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Expert Trainers</span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Experience premium fitness training with our exclusive collection of 5 world-renowned coaches. Get personalized guidance from certified professionals in strength, cardio, yoga, and specialized training.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/programs" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                  <PlayCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  Explore Programs
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <SubscriptionButton planType="monthly" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-900 dark:text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  Start Subscription
                </SubscriptionButton>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold">10,000+ Active Members</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">4.9/5 Average Rating</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold">Certified Trainers</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500 border border-gray-100 dark:border-slate-700">
                <div className="relative">
                  <img src="/uploads/gym-hero.jpg" alt="Fitness training" className="w-full h-80 object-cover rounded-2xl shadow-lg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>

                  {/* Floating Stats */}
                  <div className="absolute -top-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-bold text-sm">+25% Strength</span>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-bold text-sm">Personalized Plans</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Section */}
      <section className="py-20 lg:py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full mb-6">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Choose Your Path</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Fitness Programs for
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Every Goal</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Explore programs designed for every fitness level and goal. From beginner basics to advanced challenges, find your perfect path to success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Strength Training',
                description: 'Build muscle and power with progressive resistance training',
                icon: Dumbbell,
                color: 'from-red-500 to-pink-500',
                gradient: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
             
                features: ['Progressive overload', 'Muscle building', 'Power development']
              },
              {
                title: 'Cardio & HIIT',
                description: 'Boost endurance and burn fat with high-intensity workouts',
                icon: Heart,
                color: 'from-orange-500 to-red-500',
                gradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
             
                features: ['Fat burning', 'Endurance boost', 'Heart health']
              },
              {
                title: 'Yoga & Flexibility',
                description: 'Improve mobility and find balance with mindful movement',
                icon: Target,
                color: 'from-green-500 to-teal-500',
                gradient: 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20',
             
                features: ['Mind-body connection', 'Flexibility gains', 'Stress relief']
              },
              {
                title: 'Sports Performance',
                description: 'Enhance athletic performance with sport-specific training',
                icon: Zap,
                color: 'from-blue-500 to-purple-500',
                gradient: 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
              
                features: ['Athletic enhancement', 'Sport-specific skills', 'Peak performance']
              }
            ].map((category, i) => (
              <div key={i} className={`bg-gradient-to-br ${category.gradient} rounded-3xl p-8 hover:shadow-2xl dark:hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-slate-800 group cursor-pointer`}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{category.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{category.description}</p>

                <div className="space-y-2 mb-6">
                  {category.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Tiers Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full mb-6">
              <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Flexible Plans</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Perfect Plan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Flexible monthly and yearly plans for every fitness journey. Choose the plan that fits your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Monthly Plan</h3>
                    <p className="text-blue-100">Perfect for trying out programs</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">$29<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span></div>
                  <p className="text-gray-600 dark:text-gray-400">Cancel anytime, no commitment</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    'Access to all fitness programs',
                    'HD video demonstrations',
                    'Progress tracking dashboard',
                    'Mobile app access',
                    'Community support',
                    'Cancel anytime'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <SubscriptionButton
                  planType="monthly"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Monthly Plan
                </SubscriptionButton>
              </div>
            </div>

            {/* Yearly Plan */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl text-white overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 relative">
              <div className="absolute top-6 right-6 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                SAVE 25%
              </div>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Yearly Plan</h3>
                    <p className="text-blue-100">Best value for serious fitness enthusiasts</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl font-black mb-1">$249<span className="text-lg font-normal text-blue-100">/year</span></div>
                  <p className="text-blue-100">$20.75/month • Save $99 annually</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    'Everything in Monthly plan',
                    '25% savings vs monthly',
                    'Priority customer support',
                    'Exclusive premium content',
                    'Advanced analytics',
                    '1-on-1 coaching sessions'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white">{feature}</span>
                    </li>
                  ))}
                </ul>

                <SubscriptionButton
                  planType="yearly"
                  className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-100"
                >
                  Start Yearly Plan
                </SubscriptionButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-gray-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Growing Community</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6">
              Join a Global Fitness
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"> Revolution</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join our exclusive community of fitness enthusiasts who train with the world's most sought-after coaches. Be part of an elite group transforming their lives with premium, personalized programs.
            </p>
          </div>

          <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-8" staggerMs={150} animationClass="animate-fade-in-up">
            {[
              { title: '10,000+', subtitle: 'Active Learners', icon: Users, color: 'from-blue-500 to-cyan-500' },
              { title: '500+', subtitle: 'Video Lessons', icon: PlayCircle, color: 'from-green-500 to-emerald-500' },
              { title: '50+', subtitle: 'Expert Trainers', icon: Award, color: 'from-purple-500 to-indigo-500' },
              { title: '4.9/5', subtitle: 'Average Rating', icon: Star, color: 'from-yellow-500 to-orange-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${stat.color} rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-black mb-2 group-hover:scale-105 transition-transform">{stat.title}</div>
                <div className="text-gray-300 font-medium">{stat.subtitle}</div>
              </div>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-semibold text-yellow-200">Start Your Journey Today</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">
            Ready to Transform Your
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent"> Life?</span>
          </h2>

          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join our exclusive community of successful graduates who have transformed their bodies and lives with our 5 world-class coaches. Get access to premium training programs, expert guidance, and a supportive community of elite athletes.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <SubscriptionButton
              planType="monthly"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Crown className="h-7 w-7" />
              Start Subscription
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </SubscriptionButton>
            <Link
              href="/programs"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <PlayCircle className="h-7 w-7" />
              Browse Programs
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-blue-100">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="font-semibold">✓ Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">✓ Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-semibold">✓ 30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
