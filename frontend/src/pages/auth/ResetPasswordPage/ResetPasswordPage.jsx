import { useState, useMemo } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuthApi } from '../../../hooks/useAuthApi'
import '../LoginPage/LoginPage.css'

function passwordStrength(pwd) {
  if (!pwd) { return { score: 0, label: '' } }
  let score = 0
  if (pwd.length >= 8) { score++ }
  if (pwd.length >= 12) { score++ }
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) { score++ }
  if (/[0-9]/.test(pwd)) { score++ }
  if (/[^A-Za-z0-9]/.test(pwd)) { score++ }
  const labels = ['Weak', 'Fair', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

export default function ResetPasswordPage() {
  const { resetConfirm } = useAuthApi()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!newPassword) { setError('Please enter a new password'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await resetConfirm(token, newPassword)
      setDone(true)
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || 'Invalid or expired reset link.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-hero">
          <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        </div>
        <div className="login-pending-card">
          <p className="login-pending-text">Invalid reset link.</p>
          <Link to="/login" className="login-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="login-container">
        <div className="login-hero">
          <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        </div>
        <div className="login-pending-card">
          <div className="login-pending-icon">✓</div>
          <h2 className="login-pending-title">Password updated</h2>
          <p className="login-pending-text">Your password has been reset successfully.</p>
          <button className="login-btn" type="button" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-hero">
        <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        <p className="login-subtitle">Choose a new password</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="login-error">{error}</p>}

        <label className="login-label">
          New password
          <div className="login-input-wrap">
            <input
              className="login-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />
          </div>
          {newPassword.length > 0 && (
            <div className="pwd-strength">
              <div className="pwd-strength-bars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`pwd-strength-bar ${i <= strength.score ? `score-${strength.score}` : ''}`}
                  />
                ))}
              </div>
              <span className={`pwd-strength-label score-${strength.score}`}>{strength.label}</span>
            </div>
          )}
        </label>

        <label className="login-label">
          Confirm new password
          <div className="login-input-wrap">
            <input
              className="login-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </label>

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Set new password'}
        </button>

        <p className="login-switch">
          <Link to="/login" className="login-switch-link">Back to sign in</Link>
        </p>
      </form>
    </div>
  )
}
