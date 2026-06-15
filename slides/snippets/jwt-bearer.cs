// Add before builder.Build():
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration, "AzureAd");

// Per-user session isolation (also change to .WithInMemorySessionStore()):
builder.Services.UseClaimsBasedSessionIsolation(new()
{
    ClaimType = ClaimTypes.NameIdentifier
});

// appsettings.json:
// "AzureAd": {
//   "TenantId": "<your-tenant-id>",
//   "ClientId": "<agent-service-app-id>"
// }

var app = builder.Build();

// ... app.MapDefaultEndpoints(); etc. ...

app.UseAuthentication();
app.UseAuthorization();

// Protect AGUI endpoint — reject unauthenticated requests with 401:
app.MapAGUI(travelAgent, "/agui").RequireAuthorization();

app.Run();
