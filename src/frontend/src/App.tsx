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
import { CopilotKit, CopilotChat, useCopilotKit, useRenderTool } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { z } from "zod";
import "./App.css";
import { BookingCard, bookingSchema } from "./components/Booking";

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

const handleCopilotError = ({ error }: { error?: Error }) => {
  console.error("[CopilotKit] runtime error:", error);
};

/** Pushes a fresh bearer token into the provider without remounting it. Clears the header when token is empty. */
function TokenSync({ token }: { token: string }) {
  const { copilotkit } = useCopilotKit();
  useEffect(() => {
    copilotkit.setHeaders({ Authorization: token ? `Bearer ${token}` : "" });
  }, [copilotkit, token]);
  return null;
}

function useMsalToken(suppressAcquire = false): string | null {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] ?? null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!account || suppressAcquire || inProgress === InteractionStatus.Logout) {
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
  }, [instance, account, inProgress, suppressAcquire]);

  return token;
}

function AppContent() {
  const { instance, accounts, inProgress } = useMsal();
  const user = useAccount(accounts[0] ?? null);
  const authInProgress = inProgress !== InteractionStatus.None;
  const [logoutInitiated, setLogoutInitiated] = useState(false);
  const token = useMsalToken(logoutInitiated);

  // Reset logoutInitiated once MSAL finishes processing (popup closed or logout complete).
  // Without this, a cancelled popup leaves suppressAcquire=true forever.
  useEffect(() => {
    if (logoutInitiated && inProgress === InteractionStatus.None) {
      setLogoutInitiated(false);
    }
  }, [logoutInitiated, inProgress]);

  const handleLogin = () => {
    setLogoutInitiated(false);
    instance
      .loginPopup({ scopes: [import.meta.env.VITE_API_SCOPE], redirectUri: POPUP_REDIRECT_URI })
      .then((result) => { instance.setActiveAccount(result.account); })
      .catch((error: unknown) => {
        console.warn("[MSAL] loginPopup cancelled or failed:", error);
      });
  };

  const handleLogout = () => {
    setLogoutInitiated(true);
    instance.logoutPopup().catch((error: unknown) => {
      console.warn("[MSAL] logoutPopup cancelled or failed:", error);
    });
  };

  useRenderTool({
    name: 'GetMyBookings',
    parameters: z.null(),
    render: ({ name, status, result }) => {
      switch (status) {
        case "inProgress":
          return <p>Preparing {name}…</p>;
        case "executing":
          return <p>Fetching your bookings</p>;
        case "complete":
          try {
            const bookings: z.infer<typeof bookingSchema>[] = JSON.parse(result);
            return (
              <div className="flex flex-col gap-3 p-2">
                {bookings.map((booking, i) => (
                  <BookingCard key={i} destination={booking.destination} date={booking.date} />
                ))}
              </div>
            );
          } catch (e) {
            return <p>Issue with the bookings. Result was: {result}</p>;
          }
      }
    }
  });

  return (
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
            <span>{logoutInitiated ? "Signing out…" : inProgress !== InteractionStatus.None ? "Signing in…" : "You are browsing anonymously."}</span>
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
  );
}

export function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <CopilotKit runtimeUrl="/copilotkit" useSingleEndpoint={false} onError={handleCopilotError} agent="TravelBookingAgent">
        <AppContent />
      </CopilotKit>
    </MsalProvider>
  );
}

export default App;