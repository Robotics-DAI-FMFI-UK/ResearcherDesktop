import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthApi } from '../../../hooks/useAuthApi'
import '../LoginPage/LoginPage.css'

export default function ForgotPasswordPage() {
  const { resetRequest } = useAuthApi()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('Please enter your username'); return }
    if (!email.trim()) { setError('Please enter your email address'); return }
    setLoading(true)
    try {
      await resetRequest(username.trim(), email.trim())
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-hero">
        <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        <p className="login-subtitle">Reset your password</p>
      </div>

      {sent ? (
        <div className="login-pending-card">
          <div className="login-pending-icon">✉</div>
          <h2 className="login-pending-title">Check your email</h2>
          <p className="login-pending-text">
            If an account with that username and email exists, a password reset link has been sent.
          </p>
          <Link to="/login" className="login-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="login-error">{error}</p>}

          <label className="login-label">
            Username
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </label>

          <label className="login-label">
            Email address
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="login-switch">
            <Link to="/login" className="login-switch-link">Back to sign in</Link>
          </p>
        </form>
      )}
    </div>
  )
}
