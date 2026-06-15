// #region base
var builder = DistributedApplication.CreateBuilder(args);

var openai = builder.AddOpenAI("openai")
    .WithEndpoint("https://myfoundryinstance.services.ai.azure.com/openai/v1/");

var agentService = builder
    .AddProject<Projects.CopilotKitAuthE2e_AgentService>("agentservice")
    .WithReference(openai)
    .WithHttpHealthCheck("/health");

var devui = builder.AddDevUI("devui")
    .WithAgentService(agentService,
        agents: [new("TravelBookingAgent", "Travel booking agent")])
    .WaitFor(agentService);
// #endregion base

// #region frontend
var copilotRuntime = builder
    .AddJavaScriptApp("copilot-runtime", "../copilot-runtime")
    .WithHttpEndpoint(env: "PORT")
    .WithReference(agentService)
    .WaitFor(agentService)
    .WithExternalHttpEndpoints();

#pragma warning disable ASPIRECERTIFICATES001
var frontend = builder
    .AddViteApp("webfrontend", "../frontend")
    .WithHttpsEndpoint(7001, env: "PORT") // predictable port for Entra redirect URI
    .WithHttpsDeveloperCertificate()
    .WithExternalHttpEndpoints()
    .WithReference(copilotRuntime)
    .WaitFor(copilotRuntime);
#pragma warning restore ASPIRECERTIFICATES001
// #endregion frontend



builder.Build().Run();
