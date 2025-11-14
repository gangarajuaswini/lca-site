'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAutoLogout({
  idleMs = 15 * 60 * 1000,     // 15 minutes
  warnMs = 15 * 1000,          // 15-second popup
  heartbeatMs = 15 * 1000,     // low overhead; popup will still count down
  logoutPath = '/api/auth/logout',
  redirectTo = '/login',
}) {
  const router = useRouter()
  const [warnSeconds, setWarnSeconds] = useState(null)

  // --- stable refs (no re-renders)
  const lastActivityRef = useRef(Date.now())
  const lastWriteRef = useRef(0)        // throttle localStorage writes
  const warnedRef = useRef(false)
  const intervalRef = useRef(null)
  const loggingOutRef = useRef(false)   // ensure logout only once

  // mark activity (stable function; closes over refs)
  const bumpActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    warnedRef.current = false
    setWarnSeconds(null)
    try {
      if (now - lastWriteRef.current > 1000) {
        localStorage.setItem('lastActivityAt', String(now))
        lastWriteRef.current = now
      }
    } catch {}
  }, [])

  // cross-tab logout runner
  const doLogout = useCallback(async (fromStorage = false) => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    try { await fetch(logoutPath, { method: 'POST', credentials: 'include' }) } catch {}

    try {
      if (!fromStorage) {
        localStorage.setItem('forceLogout', '1')
        setTimeout(() => localStorage.removeItem('forceLogout'), 150)
      }
    } catch {}

    setWarnSeconds(null)
    router.push(redirectTo)
  }, [logoutPath, redirectTo, router])

  // user activity listeners
  useEffect(() => {
    const events = ['mousemove','keydown','click','scroll','touchstart']
    events.forEach(e => window.addEventListener(e, bumpActivity, { passive: true }))
    bumpActivity() // seed activity on mount
    return () => events.forEach(e => window.removeEventListener(e, bumpActivity))
  }, [bumpActivity])

  // cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'lastActivityAt' && e.newValue) {
        lastActivityRef.current = Number(e.newValue)
      }
      if (e.key === 'forceLogout' && e.newValue === '1') {
        doLogout(true) // do not rebroadcast
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [doLogout])

  // heartbeat (warn + logout)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (loggingOutRef.current) return
      const idleFor = Date.now() - lastActivityRef.current
      const timeLeft = idleMs - idleFor
      if (timeLeft <= 0) { doLogout(false); return }
      if (timeLeft <= warnMs) {
        warnedRef.current = true
        setWarnSeconds(Math.ceil(timeLeft / 1000))
      } else if (warnedRef.current) {
        warnedRef.current = false
        setWarnSeconds(null)
      }
    }, heartbeatMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [idleMs, warnMs, heartbeatMs, doLogout])

  return {
    warnSeconds,
    staySignedIn: bumpActivity,
    logoutNow: () => doLogout(false),
  }
}
