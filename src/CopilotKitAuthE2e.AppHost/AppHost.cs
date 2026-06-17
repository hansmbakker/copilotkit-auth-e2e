var builder = DistributedApplication.CreateBuilder(args);

var openai = builder.AddOpenAI("openai")
    .WithEndpoint("https://hmb-ai-services.services.ai.azure.com/openai/v1/");

var agentService = builder
    .AddProject<Projects.CopilotKitAuthE2e_AgentService>("agentservice")
    .WithReference(openai)
    .WithHttpHealthCheck("/health");

var devui = builder.AddDevUI("devui")
    .WithAgentService(agentService,
        agents: [new("TravelBookingAgent", "Travel booking agent")])
    .WaitFor(agentService);

builder.Build().Run();
