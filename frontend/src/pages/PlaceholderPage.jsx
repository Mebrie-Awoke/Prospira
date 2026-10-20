import { Settings, UserRound } from 'lucide-react'

export default function PlaceholderPage({ type }) {
  const isProfile = type === 'profile'
  const Icon = isProfile ? UserRound : Settings
  return (
    <div className="placeholder-page">
      <span className="page-icon"><Icon size={20} /></span>
      <span className="eyebrow">WORKSPACE</span>
      <h1>{isProfile ? 'Profile' : 'Settings'}</h1>
      <p>{isProfile ? 'Your account details are available here. Profile editing is not part of this milestone.' : 'Workspace preferences will be available here. No settings are configured yet.'}</p>
      <span className="coming-tag">Coming next</span>
    </div>
  )
}
