import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthApi } from '../../../hooks/useAuthApi'
import { useAuth } from '../../../context/AuthContext'
import './LoginPage.css'

function CheckIcon() {
  return (
    <svg className="login-input-check" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const { login: loginApi, register: registerApi } = useAuthApi()
  const { login } = useAuth()
  const navigate = useNavigate()

  const strength = useMemo(() => passwordStrength(password), [password])

  function switchMode(next) {
    setMode(next)
    setError('')
    setFieldErrors({})
    setPassword('')
    setConfirmPassword('')
    setEmail('')
    setPendingApproval(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errors = {}
    if (!username.trim()) { errors.username = 'Please fill in this field' }
    if (mode === 'register' && !email.trim()) { errors.email = 'Please fill in this field' }
    if (!password) { errors.password = 'Please fill in this field' }
    if (mode === 'register' && !confirmPassword) { errors.confirmPassword = 'Please fill in this field' }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = mode === 'login'
        ? await loginApi(username, password)
        : await registerApi(username, email, password, confirmPassword)

      if (data.token === null) {
        setPendingApproval(true)
        return
      }

      login(data.token, data.username, data.role)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || (mode === 'login' ? 'Invalid username or password' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const usernameValid = username.trim().length > 0 && !fieldErrors.username
  const emailValid = email.trim().length > 0 && !fieldErrors.email
  const passwordValid = password.length > 0 && !fieldErrors.password
  const confirmValid = confirmPassword.length > 0 && !fieldErrors.confirmPassword && confirmPassword === password

  if (pendingApproval) {
    return (
      <div className="login-container">
        <div className="login-hero">
          <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        </div>
        <div className="login-pending-card">
          <div className="login-pending-icon">✉</div>
          <h2 className="login-pending-title">Account pending approval</h2>
          <p className="login-pending-text">
            Your registration request has been sent to the administrator. You will receive an email once your account is approved.
          </p>
          <button className="login-btn" type="button" onClick={() => switchMode('login')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-hero">
        <h1 className="login-brand">ResearchDesk<span className="login-brand-dot">.</span></h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Sign in to access your research data' : 'Create an account to start organizing your research'}
        </p>
      </div>

      <div className="login-tabs-outer">
        <button
          type="button"
          className={`login-tab-outer ${mode === 'login' ? 'active' : ''}`}
          onClick={() => switchMode('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`login-tab-outer ${mode === 'register' ? 'active' : ''}`}
          onClick={() => switchMode('register')}
        >
          Create account
        </button>
      </div>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="login-error">{error}</p>}

        <label className="login-label">
          Username
          <div className={`login-input-wrap ${fieldErrors.username ? 'login-input-error' : ''}`}>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: '' })) }}
              autoFocus
            />
            {usernameValid && <CheckIcon />}
          </div>
          {fieldErrors.username && <span className="login-field-error">{fieldErrors.username}</span>}
        </label>

        {mode === 'register' && (
          <label className="login-label">
            Email
            <div className={`login-input-wrap ${fieldErrors.email ? 'login-input-error' : ''}`}>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })) }}
              />
              {emailValid && <CheckIcon />}
            </div>
            {fieldErrors.email && <span className="login-field-error">{fieldErrors.email}</span>}
          </label>
        )}

        <label className="login-label">
          Password
          <div className={`login-input-wrap ${fieldErrors.password ? 'login-input-error' : ''}`}>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
            />
            {passwordValid && mode === 'login' && <CheckIcon />}
          </div>
          {fieldErrors.password && <span className="login-field-error">{fieldErrors.password}</span>}
          {mode === 'register' && password.length > 0 && (
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

        {mode === 'register' && (
          <label className="login-label">
            Confirm password
            <div className={`login-input-wrap ${fieldErrors.confirmPassword ? 'login-input-error' : ''}`}>
              <input
                className="login-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })) }}
              />
              {confirmValid && <CheckIcon />}
            </div>
            {fieldErrors.confirmPassword && <span className="login-field-error">{fieldErrors.confirmPassword}</span>}
          </label>
        )}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading
            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
            : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>

        <p className="login-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button type="button" className="login-switch-link" onClick={() => switchMode('register')}>Create account</button></>
          ) : (
            <>Already have an account? <button type="button" className="login-switch-link" onClick={() => switchMode('login')}>Sign in</button></>
          )}
        </p>

        {mode === 'login' && (
          <p className="login-forgot">
            <Link to="/forgot-password" className="login-switch-link">Forgot password?</Link>
          </p>
        )}
      </form>
    </div>
  )
}
