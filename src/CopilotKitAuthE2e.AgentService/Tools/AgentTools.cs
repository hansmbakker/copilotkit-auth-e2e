using System.ComponentModel;
using System.Text.Json;

namespace CopilotKitAuthE2e.AgentService.Tools;

public class AgentTools
{
    [Description("Returns available travel destinations")]
    public IEnumerable<string> GetDestinations() =>
        ["Amsterdam", "London", "Paris", "Tokyo", "New York"];

    [Description("Returns the user's upcoming travel bookings")]
    public async Task<IEnumerable<Booking>> GetMyBookings()
    {
        var json = await File.ReadAllTextAsync("bookings.json");
        return JsonSerializer.Deserialize<IEnumerable<Booking>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        // ⚠️ Returns ALL bookings — no user filtering yet!
    }
}

public record Booking(string UserId, string Destination, DateTime Date);