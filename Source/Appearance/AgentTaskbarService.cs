using System.Diagnostics;
using System.Text.Json;

namespace CodexInstanceManager;

internal sealed record AgentIconTarget(string Provider, InstanceProfile Profile, int ProcessId, long StartedAt, IntPtr Window);

internal sealed record AgentTaskbarRequest(string Token, string AppId, string Title, string IconPath,
    int OwnerProcessId, long OwnerStartedAt, int ProcessId, long StartedAt, long Window);

internal sealed class AgentTaskbarService : IDisposable
{
    private readonly Dictionary<IntPtr, ButtonSession> ButtonDict = new();
    private readonly long OwnerStartedAt;
    private bool Disposed;

    public AgentTaskbarService()
    {
        using var Owner = Process.GetCurrentProcess();
        OwnerStartedAt = Owner.StartTime.ToUniversalTime().Ticks;
    }

    public async Task UpdateAsync(IReadOnlyList<AgentIconTarget> TargetList)
    {
        var TargetDict = TargetList.ToDictionary(Target => Target.Window);
        var RemovedList = ButtonDict.Where(Item => Item.Value.Done.WaitOne(0) ||
            !TargetDict.TryGetValue(Item.Key, out var Target) || !SameButton(Item.Value.Target, Target)).ToArray();
        foreach (var Item in RemovedList) Item.Value.Stop.Set();
        await Task.WhenAll(RemovedList.Select(Item => Item.Value.WaitForExitAsync()));
        if (Disposed) return;
        foreach (var Item in RemovedList)
        {
            ButtonDict.Remove(Item.Key);
            Item.Value.Dispose();
        }

        var PendingList = new List<ButtonSession>();
        foreach (var Target in TargetList)
        {
            if (ButtonDict.ContainsKey(Target.Window)) continue;
            var Session = new ButtonSession(Target);
            try
            {
                string Key = Target.Provider + "/" + Target.Profile.Id;
                string Hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(Key)))[..24];
                var Request = new AgentTaskbarRequest(Session.Token, "MmAgentWork.Agent." + Hash,
                    AgentDesktopBranding.DisplayName(Target.Provider) + " · " + Target.Profile.Badge, ExplorerDesktopLaunch.ResolveExistingFile(Target.Profile.IconPath),
                    Environment.ProcessId, OwnerStartedAt, Target.ProcessId, Target.StartedAt, Target.Window.ToInt64());
                string Argument = Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(Request));
                ExplorerDesktopLaunch.StartManager(new[] { "--agent-taskbar-button", Argument });
                ButtonDict.Add(Target.Window, Session);
                PendingList.Add(Session);
            }
            catch
            {
                Session.Dispose();
                throw;
            }
        }
        try { await Task.WhenAll(PendingList.Select(Session => Session.WaitForReadyAsync())); }
        catch
        {
            if (!Disposed)
            {
                foreach (var Session in PendingList.Where(Session => !Session.Ready.WaitOne(0) || Session.Done.WaitOne(0)))
                {
                    Session.Dispose();
                    ButtonDict.Remove(Session.Target.Window);
                }
            }
            throw;
        }
    }

    private static bool SameButton(AgentIconTarget Previous, AgentIconTarget Current) =>
        Previous.Provider == Current.Provider && Previous.ProcessId == Current.ProcessId && Previous.StartedAt == Current.StartedAt &&
        Previous.Profile.Id == Current.Profile.Id && Previous.Profile.Badge == Current.Profile.Badge && Previous.Profile.IconPath == Current.Profile.IconPath;

    public void Dispose()
    {
        Disposed = true;
        foreach (var Session in ButtonDict.Values) Session.Dispose();
        ButtonDict.Clear();
    }

    private sealed class ButtonSession : IDisposable
    {
        public AgentIconTarget Target { get; }
        public string Token { get; } = Guid.NewGuid().ToString("N");
        public EventWaitHandle Ready { get; }
        public EventWaitHandle Stop { get; }
        public EventWaitHandle Done { get; }

        public ButtonSession(AgentIconTarget Target)
        {
            this.Target = Target;
            Ready = NewEvent(Token, "ready");
            Stop = NewEvent(Token, "stop");
            Done = NewEvent(Token, "done");
        }

        public Task WaitForReadyAsync() => Task.Run(() =>
        {
            if (WaitHandle.WaitAny(new WaitHandle[] { Ready, Done }, 6000) == 0 && !Done.WaitOne(0)) return;
            Stop.Set();
            throw new IOException("主任务栏按钮注册失败 " + AgentDesktopBranding.DisplayName(Target.Provider) + " " + Target.Profile.Badge);
        });

        public Task WaitForExitAsync() => Task.Run(() =>
        {
            if (!Done.WaitOne(6000)) throw new IOException("原任务栏按钮尚未恢复 " + Target.Profile.Name);
        });

        public void Dispose()
        {
            Stop.Set();
            Ready.Dispose();
            Stop.Dispose();
            Done.Dispose();
        }
    }

    internal static string EventName(string Token, string Suffix) => @"Local\MmAgentTaskbar." + Token + "." + Suffix;
    private static EventWaitHandle NewEvent(string Token, string Suffix) => new(false, EventResetMode.ManualReset, EventName(Token, Suffix));
}
