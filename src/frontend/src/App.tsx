"use client";
import { useEffect, useState } from "react";
import {
  AuthenticatedTemplate,
  MsalProvider,
  UnauthenticatedTemplate,
  useAccount,
  useMsal,
} from "@azure/msal-react";
import {
  InteractionRequiredAuthError,
  InteractionStatus,
  PublicClientApplication,
} from "@azure/msal-browser";
import { CopilotKit, CopilotChat, useCopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import "./App.css";

/** Redirect bridge page for MSAL v5 popup flows. Must be registered in Azure AD. */
const POPUP_REDIRECT_URI = `${window.location.origin}/auth-redirect.html`;

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_SPA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    // redirectUri for redirect flows (not used here, but required by MSAL)
    redirectUri: window.location.origin,
  },
});

/** Pushes a fresh bearer token into the provider without remounting it. Clears the header when token is empty. */
function TokenSync({ token }: { token: string }) {
  const { copilotkit } = useCopilotKit();
  useEffect(() => {
    copilotkit.setHeaders({ Authorization: token ? `Bearer ${token}` : "" });
  }, [copilotkit, token]);
  return null;
}

function useMsalToken(): string | null {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] ?? null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!account || inProgress === InteractionStatus.Logout) {
      setToken(null);
      return;
    }
    if (inProgress !== InteractionStatus.None) return;
    let cancelled = false;

    instance
      .acquireTokenSilent({ scopes: [import.meta.env.VITE_API_SCOPE], account })
      .then((result) => {
        if (!cancelled) setToken(result.accessToken);
      })
      .catch(async (error) => {
        if (error instanceof InteractionRequiredAuthError) {
          const result = await instance.acquireTokenPopup({
            scopes: [import.meta.env.VITE_API_SCOPE],
            account,
            redirectUri: POPUP_REDIRECT_URI,
          });
          if (!cancelled) setToken(result.accessToken);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [instance, account, inProgress]);

  return token;
}

function AppContent() {
  const { instance, accounts, inProgress } = useMsal();
  const user = useAccount(accounts[0] ?? null);
  const authInProgress = inProgress !== InteractionStatus.None;
  const token = useMsalToken();

  const handleLogin = () => {
    instance
      .loginPopup({ scopes: [import.meta.env.VITE_API_SCOPE], redirectUri: POPUP_REDIRECT_URI })
      .then((result) => { instance.setActiveAccount(result.account); })
      .catch((error: unknown) => {
        console.warn("[MSAL] loginPopup cancelled or failed:", error);
      });
  };

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  return (
    <CopilotKit runtimeUrl="/copilotkit" useSingleEndpoint={false} agent="TravelBookingAgent">
      <div className="app-layout">
        <header className="app-header">
          <AuthenticatedTemplate>
            <h1>ABC Travel | Booking portal for {user?.name}</h1>
            <button onClick={handleLogout} className="auth-button" disabled={authInProgress}>
              Sign out
            </button>
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <h1>ABC Travel | Booking portal</h1>
            <div className="auth-notice">
              <span>{inProgress === InteractionStatus.Logout ? "Signing out…" : inProgress !== InteractionStatus.None ? "Signing in…" : "You are browsing anonymously."}</span>
              <button
                onClick={handleLogin}
                className="auth-button auth-button--primary"
                disabled={authInProgress}
              >
                Sign in
              </button>
            </div>
          </UnauthenticatedTemplate>
        </header>

        <main className="app-main">
          <UnauthenticatedTemplate>
            <div className="anonymous-banner">
              Sign in to work with your bookings. Without it, you will have a generic experience.
            </div>
          </UnauthenticatedTemplate>

          <TokenSync token={token ?? ""} />
          <CopilotChat agentId="TravelBookingAgent" />
        </main>
      </div>
    </CopilotKit>
  );
}

export function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;