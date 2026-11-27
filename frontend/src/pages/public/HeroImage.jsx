import { useState } from 'react'

// Keep the hero dimensions when the optional photo is unavailable.
export default function HeroImage() {
  const [missing, setMissing] = useState(false)
  if (!missing) {
    return <img src="/images/hero.jpg" className="lh-hero-image" alt="" onError={() => setMissing(true)} />
  }
  return (
    <div className="lh-hero-image lh-hero-fallback">
      <svg viewBox="0 0 240 144" aria-hidden="true" focusable="false">
        <rect x="36" y="96" width="168" height="25" rx="4" fill="var(--lh-espresso)" />
        <rect x="48" y="66" width="140" height="25" rx="4" fill="var(--lh-walnut)" />
        <rect x="69" y="38" width="126" height="23" rx="4" fill="var(--lh-caramel)" />
        <path d="M58 103v11m10-11v11m99-41v11m10-11v11M84 44v11m10-11v11"
          stroke="var(--lh-sand)" strokeWidth="3" />
      </svg>
    </div>
  )
}
