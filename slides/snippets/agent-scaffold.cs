var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

builder.AddOpenAIClient(connectionName: "openai")
       .AddChatClient("gpt-5.4-mini"); // model deployment name from Azure AI Foundry

builder.Services.AddAGUIServer();

builder.Services.AddOpenAIResponses();
builder.Services.AddOpenAIConversations();

var travelAgent = builder.AddAIAgent(
    name: "TravelBookingAgent",
    instructions: "You are a helpful travel booking assistant.")
    .WithInMemorySessionStore(withIsolation: false); // disabled for demo — add auth later

builder.Services.AddTransient<AgentTools>();
travelAgent.WithAITool(sp =>
    AIFunctionFactory.Create(
        sp.GetRequiredService<AgentTools>().GetMyBookings));

var app = builder.Build();
app.MapDefaultEndpoints();

app.MapOpenAIResponses();            // OpenAI-compatible endpoints(DevUI)
app.MapOpenAIConversations();

app.MapAGUIServer(travelAgent, "/agui");  // /agui — AGUI (Copilot Runtime)

app.Run();
