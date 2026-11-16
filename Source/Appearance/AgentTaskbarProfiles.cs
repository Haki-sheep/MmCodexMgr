using System.IO.Pipes;
using System.Text.Json;

namespace CodexInstanceManager;

internal sealed class AgentTaskbarProfiles
{
    private HashSet<int> QueriedHashList = new();
    private List<InstanceProfile> DesktopList = new();

    public async Task<IReadOnlyList<InstanceProfile>> ResolvedAsync(
        List<InstanceProfile> ManagerList, List<RunningInstance> RunningList, bool Reload)
    {
        if (!ExplorerDesktopLaunch.HasPackageIdentity()) return ManagerList;
        var MatchedHashList = ManagerList.Select(Profile => InstanceService.Find(Profile, RunningList)?.ProcessId).ToHashSet();
        var MissingHashList = RunningList.Select(Process => Process.ProcessId).Where(ProcessId => !MatchedHashList.Contains(ProcessId)).ToHashSet();
        if (MissingHashList.Count == 0)
        {
            QueriedHashList.Clear();
            return ManagerList;
        }
        if (Reload || !QueriedHashList.SetEquals(MissingHashList))
        {
            DesktopList = await ReadDesktopAsync();
            QueriedHashList = MissingHashList;
        }
        return ManagerList.Concat(DesktopList.Where(Profile => InstanceService.Find(Profile, RunningList) is { } Target &&
            MissingHashList.Contains(Target.ProcessId))).ToList();
    }

    private static async Task<List<InstanceProfile>> ReadDesktopAsync()
    {
        string Token = Guid.NewGuid().ToString("N");
        using var Pipe = new NamedPipeServerStream(PipeName(Token), PipeDirection.In, 1, PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
        using var Timeout = new CancellationTokenSource(TimeSpan.FromSeconds(6));
        ExplorerDesktopLaunch.StartManager(new[] { "--agent-taskbar-profiles", Token });
        await Pipe.WaitForConnectionAsync(Timeout.Token);
        return await JsonSerializer.DeserializeAsync<List<InstanceProfile>>(Pipe, cancellationToken: Timeout.Token)
            ?? throw new InvalidDataException("读取桌面 Codex 实例配置失败");
    }

    public static void Respond(string Token)
    {
        if (!Guid.TryParseExact(Token, "N", out _) || ExplorerDesktopLaunch.HasPackageIdentity())
            throw new InvalidOperationException("无效的桌面实例查询");
        using var Pipe = new NamedPipeClientStream(".", PipeName(Token), PipeDirection.Out, PipeOptions.CurrentUserOnly);
        Pipe.Connect(5000);
        JsonSerializer.Serialize(Pipe, SettingsStore.Load().InstanceList);
    }

    private static string PipeName(string Token) => "MmAgentTaskbarProfiles-" + Token;
}
