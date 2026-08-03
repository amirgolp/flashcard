import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// Must match the running Zitadel instance and the Client ID of the
// "flashcard-web" application created in the Zitadel console. The app
// there must be type Web + PKCE with Auth Token Type set to JWT, and
// `${origin}/callback` registered as a redirect URI.
const authority =
  import.meta.env.VITE_ZITADEL_AUTHORITY || 'http://localhost:8081'
const clientId = import.meta.env.VITE_ZITADEL_CLIENT_ID || ''

export function assertOidcConfigured() {
  if (!clientId) {
    throw new Error(
      'VITE_ZITADEL_CLIENT_ID is not set. Create a Web/PKCE application in ' +
        'the Zitadel console and put its Client ID in gui/.env.',
    )
  }
}

export const userManager = new UserManager({
  authority,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})
