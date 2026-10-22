namespace CodexInstanceManager;

public sealed record ImportedConversation(string Id, string Title, string RelativePath, bool IsSubagent, bool Archived);
public sealed record ImportFile(string RelativePath, string? PreparedPath);

public sealed class ConversationImportPlan : IDisposable
{
    public string SourceHome { get; init; } = "";
    public InstanceProfile Destination { get; init; } = new();
    public string StageRoot { get; init; } = "";
    public string? Model { get; init; }
    public string Provider { get; init; } = "";
    public bool ProjectsOnly { get; init; }
    public List<ImportedConversation> ConversationList { get; } = new();
    public List<string> SkippedList { get; } = new();
    public List<ImportFile> FileList { get; } = new();
    public Dictionary<string, string?> OriginalHashDict { get; } = new(StringComparer.OrdinalIgnoreCase);
    public int ExistingCount { get; set; }
    public int TargetCount { get; set; }
    public int ProjectCount { get; set; }
    public int ExistingProjectCount { get; set; }
    public long TotalBytes { get; set; }

    public void Dispose()
    {
        if (Directory.Exists(StageRoot)) Directory.Delete(StageRoot, true);
    }
}

internal static class ImportPaths
{
    public static string Resolve(string Root, string RelativePath)
    {
        string Result = Path.GetFullPath(Path.Combine(Root, RelativePath));
        if (!ManagerPaths.IsUnder(Result, Root)) throw new IOException("导入路径越过实例目录 " + RelativePath);
        string? Current = Result;
        while (Current is not null && (ManagerPaths.IsUnder(Current, Root) || ManagerPaths.Same(Current, Root)))
        {
            if (Path.Exists(Current) && (File.GetAttributes(Current) & FileAttributes.ReparsePoint) != 0)
                throw new IOException("导入路径包含链接 " + Current);
            Current = Path.GetDirectoryName(Current);
        }
        return Result;
    }

    public static string RolloutRelative(string Home, string Rollout)
    {
        if (Rollout.StartsWith(@"\\?\UNC\", StringComparison.OrdinalIgnoreCase)) Rollout = @"\\" + Rollout[8..];
        else if (Rollout.StartsWith(@"\\?\", StringComparison.Ordinal)) Rollout = Rollout[4..];
        string Relative = Path.GetRelativePath(Home, Rollout);
        string Result = Resolve(Home, Relative);
        if ((!ManagerPaths.IsUnder(Result, Path.Combine(Home, "sessions")) && !ManagerPaths.IsUnder(Result, Path.Combine(Home, "archived_sessions"))) || Path.GetExtension(Result) != ".jsonl")
            throw new IOException("对话正文不在支持的 sessions 或 archived_sessions 目录中");
        return Relative;
    }
}
