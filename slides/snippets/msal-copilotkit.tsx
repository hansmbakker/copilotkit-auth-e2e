// #region anonymous
import { CopilotKitProvider, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export function App() {
  return (
    <CopilotKitProvider runtimeUrl={import.meta.env.VITE_RUNTIME_URL}>
      <CopilotChat agentId="TravelBookingAgent" />
    </CopilotKitProvider>
  );
}
// #endregion anonymous

// #region msal
import { useCallback, useEffect, useMemo, useState } from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";
import { CopilotKitProvider, CopilotChat } from "@copilotkit/react-core/v2";
import type { CopilotKitProviderProps } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_SPA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
});

function useMsalToken(): string | null {
  const { instance, accounts } = useMsal();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const account = accounts[0];
    if (!account) return;
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
          });
          if (!cancelled) setToken(result.accessToken);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [instance, accounts]);

  return token;
}

function AuthenticatedChat() {
  const token = useMsalToken();

  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const onError = useCallback<NonNullable<CopilotKitProviderProps["onError"]>>(
    ({ error }) => {
      console.error("[CopilotKit] runtime error:", error);
    },
    [],
  );

  if (!token) return null;

  return (
    <CopilotKitProvider
      runtimeUrl={import.meta.env.VITE_RUNTIME_URL}
      headers={headers}
      onError={onError}
    >
      <CopilotChat agentId="TravelBookingAgent" />
    </CopilotKitProvider>
  );
}

export function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedChat />
    </MsalProvider>
  );
}
// #endregion msal
