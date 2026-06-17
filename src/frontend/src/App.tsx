import { CopilotKitProvider, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export function App() {
  return (
    <CopilotKitProvider runtimeUrl="/copilotkit">
      <CopilotChat agentId="TravelBookingAgent" />
    </CopilotKitProvider>
  );
}

export default App;