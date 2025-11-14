// src/app/admin/login/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'admin', email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        router.replace('/admin/inbox')
      } else {
        alert(data?.message || 'Login failed')
      }
    } catch (err) {
      console.error('Admin login error:', err)
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow p-6 sm:p-8">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gold-300">Admin Login</h1>
        <p className="text-sm text-muted mt-1">Sign in to access the dashboard.</p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-muted mb-1">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/60"
              placeholder="you@domain.com"
            />
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-500 hover:bg-gold-400 text-ink font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
 