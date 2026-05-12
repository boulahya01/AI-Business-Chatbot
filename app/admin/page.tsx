'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminAuth from '@/app/components/AdminAuth'
import AdminPanel from '@/app/components/AdminPanel'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminAuth onSuccess={() => window.location.reload()} />
  }

  return (
    <div>
      <div className="absolute top-4 right-4 flex gap-3 z-50">
        <span className="text-sm text-slate-600">{user.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Logout
        </button>
      </div>
      <AdminPanel />
    </div>
  )
}
