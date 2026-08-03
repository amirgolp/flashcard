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

// Reject anything in storage that is not an unexpired JWT — e.g. tokens
// left over from the pre-Zitadel username/password flow. Without this the
// route guard treats any stored string as a session.
function loadStoredToken(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    if (typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()) {
      return token
    }
  } catch {
    // not a decodable JWT — treat as stale
  }
  localStorage.removeItem('access_token')
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadStoredToken)

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
