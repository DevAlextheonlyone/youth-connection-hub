'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) alert(error.message)
    setLoading(false)
  }

  async function signUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) alert(error.message)
    setLoading(false)
  }

  async function resetPassword() {
    if (!email) {
      alert('Enter your email first')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://youth-connection-hub.vercel.app/reset-password',
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Password reset email sent')
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>Youth Connection Hub</h1>

      <p style={{ color: '#666', marginBottom: 30 }}>
        Login or create an account to continue
      </p>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 20 }}
      />

      <button
        onClick={signIn}
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        Sign In
      </button>

      <button
        onClick={signUp}
        disabled={loading}
        style={{ width: '100%', padding: 10, marginTop: 10 }}
      >
        Sign Up
      </button>

      <button
        onClick={resetPassword}
        disabled={loading}
        style={{
          width: '100%',
          padding: 10,
          marginTop: 20,
          background: '#333',
          color: '#fff',
        }}
      >
        Forgot password?
      </button>

      {/* Discord support */}
      <div style={{ marginTop: 40 }}>
        <p style={{ marginBottom: 10, color: '#666' }}>
          Need help or support?
        </p>
        <a
          href="https://discord.gg/ptm4PrDUrB"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#5865F2',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Join our Discord
        </a>
      </div>
    </main>
  )
}
