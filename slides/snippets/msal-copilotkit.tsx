// #region anonymous
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export function App() {
  return (
    <CopilotKit runtimeUrl="/copilotkit"
      useSingleEndpoint={false}
      agent="TravelBookingAgent">
      <CopilotChat agentId="TravelBookingAgent" />
    </CopilotKit>
  );
}
// #endregion anonymous

// #region msal
import { useEffect, useState } from "react";
import { MsalProvider, useMsal, useAccount } from "@azure/msal-react";
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  InteractionStatus,
} from "@azure/msal-browser";
import { CopilotKit, CopilotChat, useCopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_SPA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
});

/** Pushes a fresh bearer token into CopilotKit without remounting. */
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
            redirectUri: `${window.location.origin}/auth-redirect.html`,
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
  const token = useMsalToken();

  return (
    <CopilotKit runtimeUrl="/copilotkit" useSingleEndpoint={false} agent="TravelBookingAgent">
      <TokenSync token={token ?? ""} />
      <CopilotChat agentId="TravelBookingAgent" />
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
// #endregion msal
