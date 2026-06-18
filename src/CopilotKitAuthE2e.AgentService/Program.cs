using System.Security.Claims;
using CopilotKitAuthE2e.AgentService.Tools;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.AI;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

builder.AddOpenAIClient(connectionName: "openai")
       .AddChatClient("gpt-5.4-mini"); // model deployment name from Azure AI Foundry

builder.Services.AddAGUI();

builder.Services.AddOpenAIResponses();
builder.Services.AddOpenAIConversations();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration, "AzureAd");

var travelAgent = builder.AddAIAgent(
    name: "TravelBookingAgent",
    instructions: "You are a helpful travel booking assistant.")
    .WithInMemorySessionStore(withIsolation: true);

builder.Services.UseClaimsBasedSessionIsolation(new()
{
    ClaimType = ClaimTypes.NameIdentifier
});

builder.Services.AddTransient<AgentTools>();
travelAgent.WithAITool(sp =>
    AIFunctionFactory.Create(
        sp.GetRequiredService<AgentTools>().GetDestinations));
travelAgent.WithAITool(sp =>
    AIFunctionFactory.Create(
        sp.GetRequiredService<AgentTools>().GetMyBookings));

var app = builder.Build();
app.MapDefaultEndpoints();

app.UseAuthentication();
app.UseAuthorization();

app.MapOpenAIResponses();            // /openai/ — OpenAI-compatible (DevUI)
app.MapOpenAIConversations();

app.MapAGUI(travelAgent, "/agui").RequireAuthorization();  // /agui — AGUI (Copilot Runtime)

app.Run();