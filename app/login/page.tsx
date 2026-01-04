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

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>Youth Connection Hub</h1>

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

      <button onClick={signIn} disabled={loading} style={{ width: '100%', padding: 10 }}>
        Sign In
      </button>

      <p>or</p>

      <button onClick={signUp} disabled={loading} style={{ width: '100%', padding: 10 }}>
        Sign Up
      </button>
    </main>
  )
}
