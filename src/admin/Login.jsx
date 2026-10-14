import { useState } from 'react'
import { supabase } from '@shared/supabase.js'
import { Field } from '@shared/ui.jsx'
import { errorMessage } from '@shared/utils.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : errorMessage(error))
    setBusy(false)
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo-512.png" alt="The Frame Story" width="140" height="140" className="login-logo" />
        <h1>Admin sign in</h1>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <span className="spinner" /> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
