using System.ComponentModel;

namespace CopilotKitAuthE2e.AgentService.Tools;

public class AgentTools
{
    [Description("Returns available travel destinations")]
    public IEnumerable<string> GetDestinations() =>
        ["Amsterdam", "London", "Paris", "Tokyo", "New York"];
}