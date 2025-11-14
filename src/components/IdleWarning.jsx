//src/components/IdleWarning.jsx
'use client'
export default function IdleWarning({ seconds, onStay }) {
  if (seconds == null) return null
  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-50 bg-card border border-gold-$1 shadow-lg rounded-lg p-3 text-sm"
    >
      <div className="font-medium">
        You’ll be logged out in {seconds}s due to inactivity.
      </div>
      <div className="mt-2 flex gap-2 justify-end">
        <button onClick={onStay} className="px-3 py-1 border rounded">
          I’m still here
        </button>
      </div>
    </div>
  )
}
