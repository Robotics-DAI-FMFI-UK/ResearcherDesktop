import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../utils/icons'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.username ? user.username.charAt(0).toUpperCase() : '?'

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">ResearchDesk</span>
        <button className="navbar-calendar-btn" onClick={() => navigate('/calendar')} title="Calendar">
          <Icon name="calendar" size={16} />
        </button>
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
