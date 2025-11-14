//src/components/LogoutButton.jsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton({ className = '' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (_) {}
    // optional: clear any local storage tokens if you use them
    try { localStorage.removeItem('auth'); } catch {}
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className={`pill-gold ${busy ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      aria-label="Logout"
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  )
}
