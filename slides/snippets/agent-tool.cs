// #region destinations
public class AgentTools
{
    [Description("Returns available travel destinations")]
    public IEnumerable<string> GetDestinations() =>
        ["Amsterdam", "London", "Paris", "Tokyo", "New York"];
}
// #endregion destinations

// #region anonymous
public class AgentTools
{
    [Description("Returns the user's upcoming travel bookings")]
    public async Task<IEnumerable<Booking>> GetMyBookings()
    {
        var json = await File.ReadAllTextAsync("bookings.json");
        return JsonSerializer.Deserialize<IEnumerable<Booking>>(json)!;
        // ⚠️ Returns ALL bookings — no user filtering yet!
    }
}
// #endregion anonymous

// #region authenticated
public class AgentTools(
    IServiceScopeFactory scopeFactory,
    IHttpContextAccessor httpContextAccessor)
{
    private string GetCurrentUserId() =>
        httpContextAccessor.HttpContext?.User.GetObjectId()
            ?? throw new InvalidOperationException("User not authenticated");

    [Description("Returns the user's upcoming travel bookings")]
    public async Task<IEnumerable<Booking>> GetMyBookings()
    {
        var userId = GetCurrentUserId();
        var json = await File.ReadAllTextAsync("bookings.json");
        var all = JsonSerializer.Deserialize<IEnumerable<Booking>>(json)!;
        return all.Where(b => b.UserId == userId);
    }
}
// #endregion authenticated
