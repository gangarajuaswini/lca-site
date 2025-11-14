// src/app/login/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Camera, Shield, User } from 'lucide-react'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referenceId, setReferenceId] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    //setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'customer', email, password, referenceId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        router.replace('/customer-dashboard')
        return
      } else {
        alert(data?.message || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Customer login error:', err)
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex min-h-svh flex-col bg-ink">
      <Header />
      <main className="flex-1 flex justify-center pt-28 md:pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Branding */}
            <div className="hidden lg:block">
              <div className="text-center space-y-8">
                <div>
                  {/* logo */}
                  <Image
                    src="/logo.jpg"
                    alt="LCA Visual Studios logo"
                    width={256}
                    height={256}
                    priority
                    className="mx-auto mb-6 animate-bounce
                    w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52
                    object-contain"
                  />
                </div>
                
                <h1 className="text-5xl font-bold font-playfair text-text mb-4">
                  Welcome Back to
                  <span className="block text-gold-300">LCA Visual Studios</span>
                </h1>
                
                <p className="text-xl text-muted leading-relaxed">
                  Access your personalized client portal to view your photos, 
                  select favorites for editing, and download your final images.
                </p>

                {/* Features */}
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gold-300" />
                    <span className="text-muted">Secure client portal access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Camera className="h-5 w-5 text-gold-300" />
                    <span className="text-muted">View and select your photos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gold-300" />
                    <span className="text-muted">Track project progress</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="panel-gold-outline p-8 lg:p-10">
              <div className="max-w-xl mx-auto p-6">
                <h1 className="text-2xl font-bold font-playfair text-gold-300 mb-6">Customer Login</h1>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block form-label-lg mb-2">Email Address</label>
                    <input id="email" name="email" type="email" autoComplete="email"
                      className="form-input"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
{/*
                  <div>
                    <label htmlFor="password" className="block form-label-lg mb-2">Password</label>
                    <input id="password" name="password" type="password" autoComplete="current-password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
*/}

                  <div>
                    <label htmlFor="password" className="block text-sm text-muted mb-1">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 pr-10 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-2 my-auto h-8 w-8 grid place-items-center rounded-md text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                        tabIndex={0}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ref" className="block form-label-lg mb-2">Reference ID</label>
                    <input id="ref" name="referenceId" type="text"
                      className="form-input"
                      placeholder="LCA-XXXX..."
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value.trim())}
                      required
                    />
                  </div>

                  <button
                    className="w-full btn-gold rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? 'Signing in…' : 'Login'}
                  </button>
                </form>
              </div>
              <div className="text-center space-y-4">
                <p className="text-muted">
                  <Link href="/contact" className="link-gold-deluxe">
                    New Customer? Submit an inquiry to get started
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}