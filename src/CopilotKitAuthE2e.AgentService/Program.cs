using CopilotKitAuthE2e.AgentService.Tools;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

builder.AddOpenAIClient(connectionName: "openai")
       .AddChatClient("gpt-5.4-mini"); // model deployment name from Azure AI Foundry

builder.Services.AddAGUI();

builder.Services.AddOpenAIResponses();
builder.Services.AddOpenAIConversations();

var travelAgent = builder.AddAIAgent(
    name: "TravelBookingAgent",
    instructions: "You are a helpful travel booking assistant.")
    .WithInMemorySessionStore(withIsolation: false); // disabled for demo — add auth later

builder.Services.AddTransient<AgentTools>();
travelAgent.WithAITool(sp =>
    AIFunctionFactory.Create(
        sp.GetRequiredService<AgentTools>().GetDestinations));

var app = builder.Build();
app.MapDefaultEndpoints();

app.MapOpenAIResponses();            // OpenAI-compatible endpoints (DevUI)
app.MapOpenAIConversations();

app.MapAGUI(travelAgent, "/agui");  // /agui — AGUI (Copilot Runtime)

app.Run();