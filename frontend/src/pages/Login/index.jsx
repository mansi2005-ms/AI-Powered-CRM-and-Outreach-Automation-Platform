import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ErrorBanner } from '../../components/feedback/Spinner'
import { apiClient } from '../../api/client'

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      if (onLoginSuccess) onLoginSuccess(data.user)
      navigate('/pipeline')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  function setDemoUser(demoEmail, demoPass = 'Password123!') {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-app)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>
            AI CRM & Outreach Platform
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Sign in to access your operations dashboard
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="intern@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%' }}>
            Sign In
          </Button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Quick Demo Logins:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setDemoUser('admin@example.com')} style={{ fontSize: '12px', padding: '6px' }}>
              Admin
            </Button>
            <Button variant="secondary" onClick={() => setDemoUser('researcher@example.com')} style={{ fontSize: '12px', padding: '6px' }}>
              Researcher
            </Button>
            <Button variant="secondary" onClick={() => setDemoUser('campaigns@example.com')} style={{ fontSize: '12px', padding: '6px' }}>
              Campaign Mgr
            </Button>
            <Button variant="secondary" onClick={() => setDemoUser('developer@example.com')} style={{ fontSize: '12px', padding: '6px' }}>
              Developer
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
