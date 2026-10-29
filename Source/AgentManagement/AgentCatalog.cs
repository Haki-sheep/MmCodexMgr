using System.Text.Json;

namespace CodexInstanceManager;

public sealed record AgentProject(string Id, string Name, string Path, bool IsGitRepository);
public sealed record AgentSession(string Id, string Title, string ProjectId, string Cwd);

public interface IAgentCatalog
{
    Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation);
    List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset);
    AgentSession Session(InstanceProfile Instance, string Id);
    Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation);
    Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation);
}

public sealed class AgentCatalog : IAgentCatalog
{
    public async Task<List<AgentProject>> ProjectsAsync(InstanceProfile Instance, CancellationToken Cancellation)
    {
        string Caller = LatestThread(Instance);
        var Data = await DesktopRelayBridge.CallAsync(Instance, Caller, "list_projects", new { }, Cancellation);
        return Data.GetProperty("projects").EnumerateArray()
            .Where(Item => Item.GetProperty("projectKind").GetString() == "local" && Item.GetProperty("hostId").GetString() == "local")
            .Select(Item => new AgentProject(Item.GetProperty("projectId").GetString()!, Item.GetProperty("label").GetString()!, Item.GetProperty("path").GetString()!, Item.GetProperty("isGitRepository").GetBoolean())).ToList();
    }

    public List<AgentSession> Sessions(InstanceProfile Instance, AgentProject? Project, string? Selector, int Offset)
    {
        if (Offset < 0) throw new ArgumentOutOfRangeException(nameof(Offset));
        using var Database = ConversationDatabase.Open(Path.Combine(Instance.HomePath, "state_5.sqlite"), true);
        Database.CreateFunction("manager_path", (string Value) => NormalizePath(Value));
        using var Command = Database.CreateCommand();
        string ProjectFilter = Project is null ? "" : " AND (project_id=$project OR (project_id IS NULL AND CASE WHEN cwd<>'' THEN manager_path(cwd) END=$path))";
        Command.CommandText = "SELECT id,COALESCE(NULLIF(name,''),title),COALESCE(project_id,''),cwd FROM threads WHERE archived=0" + ProjectFilter + " AND ($selector IS NULL OR id=$selector OR COALESCE(NULLIF(name,''),title)=$selector) ORDER BY updated_at DESC,id LIMIT $limit OFFSET $offset";
        if (Project is not null)
        {
            Command.Parameters.AddWithValue("$project", Project.Id);
            Command.Parameters.AddWithValue("$path", NormalizePath(Project.Path));
        }
        Command.Parameters.AddWithValue("$selector", (object?)Selector ?? DBNull.Value);
        Command.Parameters.AddWithValue("$limit", RelayLimits.PageSize);
        Command.Parameters.AddWithValue("$offset", Offset);
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<AgentSession>();
        while (Reader.Read()) ResultList.Add(new(Reader.GetString(0), Reader.GetString(1), Reader.GetString(2), Reader.GetString(3)));
        return ResultList;
    }

    public AgentSession Session(InstanceProfile Instance, string Id)
    {
        using var Database = ConversationDatabase.Open(Path.Combine(Instance.HomePath, "state_5.sqlite"), true);
        using var Command = Database.CreateCommand();
        Command.CommandText = "SELECT id,COALESCE(NULLIF(name,''),title),COALESCE(project_id,''),cwd FROM threads WHERE id=$id AND archived=0";
        Command.Parameters.AddWithValue("$id", Id);
        using var Reader = Command.ExecuteReader();
        if (!Reader.Read()) throw new InvalidOperationException("实例内没有此未归档会话 " + Instance.Name + " / " + Id);
        return new(Reader.GetString(0), Reader.GetString(1), Reader.GetString(2), Reader.GetString(3));
    }

    public async Task RequireIdleAsync(InstanceProfile Instance, string ThreadId, CancellationToken Cancellation)
    {
        var Data = await DesktopRelayBridge.CallAsync(Instance, ThreadId, "read_thread", new { threadId = ThreadId, hostId = "local", turnLimit = 1, includeOutputs = false, maxOutputCharsPerItem = 0 }, Cancellation);
        string Status = Data.GetProperty("thread").GetProperty("status").GetProperty("type").GetString()!;
        if (Status != "idle") throw new InvalidOperationException("目标会话尚未空闲 当前状态 " + Status + " 请结束当前任务后再启动联调");
    }

    public async Task<RelayThread> CreateAsync(InstanceProfile Instance, AgentProject? Project, string Title, string Prompt, CancellationToken Cancellation)
    {
        object Target = Project is null ? new { type = "projectless" } : new { type = "project", projectId = Project.Id, environment = new { type = "local" } };
        var Data = await DesktopRelayBridge.CallAsync(Instance, LatestThread(Instance), "create_thread", new { title = Title, prompt = Prompt, target = Target }, Cancellation);
        if (!Data.TryGetProperty("threadId", out var Id)) throw new IOException("桌面未返回就绪会话 ID 请人工核对创建结果 不得重复创建 " + Data.GetRawText());
        return new(Id.GetString()!, Title, "active");
    }

    public static string NormalizePath(string Value)
    {
        if (Value.StartsWith(@"\\?\UNC\", StringComparison.OrdinalIgnoreCase)) Value = @"\\" + Value[8..];
        else if (Value.StartsWith(@"\\?\", StringComparison.Ordinal)) Value = Value[4..];
        return ManagerPaths.Normalize(Value).ToUpperInvariant();
    }

    private static string LatestThread(InstanceProfile Instance)
    {
        using var Database = ConversationDatabase.Open(Path.Combine(Instance.HomePath, "state_5.sqlite"), true);
        return ConversationDatabase.Scalar(Database, "SELECT id FROM threads WHERE archived=0 ORDER BY updated_at DESC LIMIT 1") as string ?? throw new InvalidOperationException("实例尚无可用会话 请先在该实例打开一个会话 " + Instance.Name);
    }
}
