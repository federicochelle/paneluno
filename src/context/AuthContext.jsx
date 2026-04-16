import { createContext, useEffect, useMemo, useState } from 'react'
import { devBypassUser, isDevBypassAuthEnabled } from '../lib/devAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(
    () => isSupabaseConfigured && !isDevBypassAuthEnabled,
  )

  useEffect(() => {
    if (isDevBypassAuthEnabled || !isSupabaseConfigured || !supabase) {
      return undefined
    }

    let isMounted = true

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (isMounted) {
        setSession(currentSession)
        setLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => {
      const bypassSession = isDevBypassAuthEnabled ? { user: devBypassUser } : null

      return {
        session: session ?? bypassSession,
      user: session?.user ?? (isDevBypassAuthEnabled ? devBypassUser : null),
      loading,
      isAuthenticated: Boolean(session) || isDevBypassAuthEnabled,
      isSupabaseConfigured,
      isDevBypassAuthEnabled,
      isUsingBypassAuth: isDevBypassAuthEnabled && !session,
      }
    },
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
