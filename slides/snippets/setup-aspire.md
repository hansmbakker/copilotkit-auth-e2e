# Prompts

## Add Aspire AppHost and ServiceDefaults
Add an empty .NET Aspire AppHost and ServiceDefaults to my solution.
The projects should be added to a folder called `src` that is created in the workspace root.
If an aspire.config.json was generated, move it to the workspace root and update the reference to the AppHost project. Otherwise, generate a new aspire.config.json in the workspace root with the correct reference to the AppHost project.

```bash
dotnet new aspire --name CopilotKitAuthE2e --output src/
aspire add Aspire.Hosting.OpenAI
aspire add Aspire.Hosting.AgentFramework.DevUI
dotnet new web -o src/CopilotKitAuthE2e.AgentService
dotnet sln add src/CopilotKitAuthE2e.AgentService/CopilotKitAuthE2e.AgentService.csproj
dotnet add src/CopilotKitAuthE2e.AppHost/CopilotKitAuthE2e.AppHost.csproj reference src/CopilotKitAuthE2e.AgentService/CopilotKitAuthE2e.AgentService.csproj
```