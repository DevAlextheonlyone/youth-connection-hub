'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  async function updatePassword() {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password,
    })
    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Password updated successfully')
      router.push('/login')
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>Reset password</h1>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 20 }}
      />

      <button onClick={updatePassword} disabled={loading} style={{ width: '100%', padding: 10 }}>
        Update password
      </button>
    </main>
  )
}
