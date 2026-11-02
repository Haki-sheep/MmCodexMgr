using System.Text.Json;

namespace CodexInstanceManager;

public interface IAgentDesktopBridge
{
    Task EnsureAvailableAsync(InstanceProfile Instance, CancellationToken Cancellation);
    Task<JsonElement> CallAsync(InstanceProfile Instance, string CallerThreadId, string Tool, object Arguments, CancellationToken Cancellation);
}

public sealed class AgentDesktopBridge : IAgentDesktopBridge
{
    public Task EnsureAvailableAsync(InstanceProfile Instance, CancellationToken Cancellation) => DesktopRelayBridge.EnsureAvailableAsync(Instance, Cancellation);

    public Task<JsonElement> CallAsync(InstanceProfile Instance, string CallerThreadId, string Tool, object Arguments, CancellationToken Cancellation) => DesktopRelayBridge.CallAsync(Instance, CallerThreadId, Tool, Arguments, Cancellation);
}
