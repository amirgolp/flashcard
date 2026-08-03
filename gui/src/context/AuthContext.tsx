import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { userManager, assertOidcConfigured } from '../auth/oidc'

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  login: () => Promise<void>
  completeLogin: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token'),
  )

  const login = useCallback(async () => {
    assertOidcConfigured()
    await userManager.signinRedirect()
  }, [])

  // Called on the /callback route after Zitadel redirects back. The backend
  // provisions the local user on the first authenticated request, so there
  // is no separate registration step.
  const completeLogin = useCallback(async () => {
    const user = await userManager.signinCallback()
    if (!user?.access_token) {
      throw new Error('Zitadel did not return an access token')
    }
    localStorage.setItem('access_token', user.access_token)
    setToken(user.access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    void userManager.signoutRedirect().catch(() => {
      window.location.href = '/login'
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        completeLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
