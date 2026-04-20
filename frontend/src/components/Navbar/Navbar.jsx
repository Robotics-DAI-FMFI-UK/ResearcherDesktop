import { useAuth } from '../../auth/AuthContext/AuthContext'
import { Icon } from '../../utils/icons'
import './Navbar.css'

const MODES = [
  { key: 'BASIC', label: 'Basic' },
  { key: 'EXTENDED', label: 'Extended' },
  { key: 'ADVANCED', label: 'Advanced' },
]

export default function Navbar() {
  const { user, logout, mode, updateMode } = useAuth()

  async function handleModeChange(m) {
    if (m === mode || m === 'ADVANCED') { return }
    try {
      await updateMode(m)
    } catch {
    }
  }

  const initials = user?.username ? user.username.charAt(0).toUpperCase() : '?'

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">ResearchDesk</span>
        <div className="navbar-modes">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => handleModeChange(key)}
              disabled={key === 'ADVANCED'}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-avatar" title={user?.username}>
          {initials}
        </div>
        <span className="navbar-username">{user?.username}</span>
        <button className="navbar-logout" onClick={logout}>
          <Icon name="log-out" size={14} />
          Log out
        </button>
      </div>
    </nav>
  )
}
