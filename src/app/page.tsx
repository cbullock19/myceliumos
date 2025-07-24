'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Users, 
  Zap, 
  ArrowRight,
  Play,
  Star,
  Building,
  Calendar,
  BarChart3,
  Shield,
  Clock,
  Target,
  Sparkles,
  TrendingUp
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Organize all your clients with custom service types and automatic folder creation",
    color: "bg-blue-50 text-blue-600"
  },
  {
    icon: Calendar,
    title: "Deliverable Tracking",
    description: "Never miss a deadline with our intelligent deliverable management system",
    color: "bg-green-50 text-green-600"
  },
  {
    icon: Building,
    title: "Team Collaboration",
    description: "Role-based permissions and real-time notifications keep everyone aligned",
    color: "bg-purple-50 text-purple-600"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track performance, identify bottlenecks, and optimize your agency's operations",
    color: "bg-orange-50 text-orange-600"
  }
]

const stats = [
  { number: "500+", label: "Agencies Trust Us" },
  { number: "15hr", label: "Saved Per Week" },
  { number: "99.9%", label: "Uptime SLA" },
  { number: "24/7", label: "Expert Support" }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Creative Director",
    company: "Pixel Perfect Agency",
    content: "Mycelium OS transformed how we manage our 50+ clients. Our team is more organized than ever, and our clients love the professional portal.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "Agency Owner",
    company: "Digital Growth Co",
    content: "The automated workflows saved us 15 hours per week. The ROI was immediate and our team efficiency has never been higher.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Jennifer Walsh",
    role: "Operations Manager",
    company: "Creative Solutions Ltd",
    content: "Finally, a platform that understands agencies. The deliverable tracking and client communication features are game-changers.",
    rating: 5,
    avatar: "JW"
  }
]

const benefits = [
  "Get operational in 10 minutes with our guided setup wizard",
  "Complete multi-tenant isolation - your data stays secure and private",
  "Automated workflows that save 15+ hours per week for your team",
  "Professional client portal that impresses and reduces support tickets",
  "Real-time collaboration tools that keep teams perfectly aligned",
  "White-label branding that makes the platform truly yours"
]

export default function HomePage() {
  const router = useRouter()

  // Check for auth tokens in URL and redirect to callback if found
  useEffect(() => {
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)
    
    // Check for auth tokens in hash (Supabase email confirmation)
    if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
      console.log('🔍 Found auth tokens in hash, redirecting to callback...')
      router.push('/auth/callback' + hash)
      return
    }
    
    // Check for auth tokens in search params
    if (searchParams.get('access_token') || searchParams.get('refresh_token') || searchParams.get('code')) {
      console.log('🔍 Found auth tokens in search params, redirecting to callback...')
      router.push('/auth/callback' + window.location.search)
      return
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Mycelium OS</span>
              <Badge variant="outline" className="hidden sm:inline-flex text-xs bg-green-50 text-green-700 border-green-200">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 py-20 lg:py-28">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-gray-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Now in Beta - Limited Time Free Access</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The Operations Platform for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
                Creative Agencies
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Streamline client management, track deliverables, and empower your team with the most comprehensive agency operations platform ever built. Join 500+ agencies already scaling with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg text-lg px-8 py-4 h-auto"
                  rightIcon={<ArrowRight className="h-5 w-5 ml-2" />}
                >
                  Start Free Trial
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 text-lg px-8 py-4 h-auto hover:bg-gray-50"
                leftIcon={<Play className="h-5 w-5 mr-2" />}
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <p className="text-sm text-gray-500 mb-8">
              <span className="inline-flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-500" />
                No credit card required
              </span>
              <span className="mx-3">•</span>
              <span className="inline-flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                14-day free trial
              </span>
              <span className="mx-3">•</span>
              <span className="inline-flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                Setup in 10 minutes
              </span>
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-6 shadow-sm">
              <Target className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-gray-700">Core Features</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything your agency needs to thrive
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From client onboarding to project delivery, Mycelium OS handles every aspect of your agency operations with precision and style.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 mb-6">
                <Building className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-gray-700">Built for Agencies</span>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Built by agency owners, for agency owners
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                We understand the unique challenges of running a creative agency. That's why every feature is designed with real-world agency workflows in mind.
              </p>
              
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand shadow-lg">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="order-1 lg:order-2">
              <Card className="bg-gradient-to-br from-brand to-brand-hover text-white p-8 border-0 shadow-xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Ready in 10 Minutes</h3>
                  <p className="text-brand-light text-lg leading-relaxed">
                    Our intelligent 5-step onboarding wizard gets your entire agency operational faster than any other platform. No complex setup, no technical headaches.
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        15hrs saved/week
                      </span>
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Enterprise secure
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-6 shadow-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Customer Success</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by 500+ creative agencies
            </h2>
            <p className="text-xl text-gray-600">
              See how agencies like yours are scaling operations and delighting clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-hover rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 shadow-xl border border-gray-100">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Ready to transform your agency?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join hundreds of agencies already using Mycelium OS to streamline their operations, delight their clients, and scale their business with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand shadow-lg text-lg px-8 py-4 h-auto"
                  rightIcon={<ArrowRight className="h-5 w-5 ml-2" />}
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 text-lg px-8 py-4 h-auto hover:bg-gray-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-500" />
                14-day free trial
              </span>
              <span className="mx-3">•</span>
              <span>No setup fees</span>
              <span className="mx-3">•</span>
              <span>Cancel anytime</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-hover rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-bold text-2xl">Mycelium OS</span>
            </div>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              The Operations Platform for Creative Agencies
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-400 mb-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Mycelium OS. All rights reserved. Built with ❤️ for creative agencies worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}