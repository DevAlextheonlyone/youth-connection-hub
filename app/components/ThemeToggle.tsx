'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light'
    )
  }, [dark])

  return (
    <button onClick={() => setDark(!dark)}>
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
