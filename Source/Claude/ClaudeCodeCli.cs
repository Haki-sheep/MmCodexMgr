using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

internal static class ClaudeCodeCli
{
    public static string Home => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".claude");
    private static string DesktopHome => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Claude-3p");

    public static string ResolvePath()
    {
        var CandidateList = (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries)
            .Select(Folder => Folder.Trim('"')).Where(Path.IsPathFullyQualified).Select(Folder => Path.Combine(Folder, "claude.exe")).ToList();
        CandidateList.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "npm", "node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe"));
        CandidateList.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "bin", "claude.exe"));
        return CandidateList.FirstOrDefault(File.Exists) ?? throw new FileNotFoundException("未找到 Claude Code CLI 的 claude.exe 请先安装 Claude Code");
    }

    public static ProcessStartInfo StartInfo(string CliPath, string Cwd, string Model, string? ConfigHome = null)
    {
        string Library = Path.Combine(DesktopHome, "configLibrary");
        using var Meta = JsonDocument.Parse(File.ReadAllText(Path.Combine(Library, "_meta.json")));
        if (!Meta.RootElement.TryGetProperty("appliedId", out var Applied) || !Guid.TryParseExact(Applied.GetString(), "D", out var Id))
            throw new InvalidOperationException("请在 CC Switch 的 Claude Desktop 页启用网关供应商");
        using var Profile = JsonDocument.Parse(File.ReadAllText(Path.Combine(Library, Id.ToString("D") + ".json")));
        var Data = Profile.RootElement;
        if (Data.GetProperty("inferenceProvider").GetString() != "gateway")
            throw new InvalidOperationException("Claude 协作需要已启用的 Claude Desktop 网关");
        string? Url = Data.GetProperty("inferenceGatewayBaseUrl").GetString();
        string? Key = Data.GetProperty("inferenceGatewayApiKey").GetString();
        string? Scheme = Data.TryGetProperty("inferenceGatewayAuthScheme", out var AuthScheme) ? AuthScheme.GetString() : "bearer";
        if (!Uri.TryCreate(Url, UriKind.Absolute, out var Gateway) || Gateway.UserInfo.Length != 0 || Gateway.Scheme != "https" && !(Gateway.IsLoopback && Gateway.Scheme == "http")
            || string.IsNullOrWhiteSpace(Key) || Scheme is not ("bearer" or "x-api-key"))
            throw new InvalidDataException("Claude Desktop 网关地址或静态 API Key 配置无效");
        var Info = new ProcessStartInfo(CliPath) { WorkingDirectory = Cwd, UseShellExecute = false };
        foreach (string Name in Info.Environment.Keys.Where(Name => Name.StartsWith("ANTHROPIC_", StringComparison.OrdinalIgnoreCase) || Name.StartsWith("CLAUDE_CODE_", StringComparison.OrdinalIgnoreCase)).ToList())
            Info.Environment.Remove(Name);
        foreach (string Name in new[] { "CLAUDECODE", "CODEX_HOME", "CODEX_THREAD_ID", "OPENAI_API_KEY" }) Info.Environment.Remove(Name);
        Info.Environment["CLAUDE_CONFIG_DIR"] = ConfigHome ?? Home;
        Info.Environment["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1";
        Info.Environment["ANTHROPIC_BASE_URL"] = Gateway.AbsoluteUri.TrimEnd('/');
        Info.Environment[Scheme == "bearer" ? "ANTHROPIC_AUTH_TOKEN" : "ANTHROPIC_API_KEY"] = Key;
        if (Model.Length != 0) Info.Environment["ANTHROPIC_MODEL"] = Model;
        return Info;
    }

    public static void AddSessionOptions(ProcessStartInfo Info)
    {
        foreach (string Argument in new[] { "--setting-sources", "", "--strict-mcp-config", "--mcp-config", "{\"mcpServers\":{}}" }) Info.ArgumentList.Add(Argument);
        string RulePath = Path.Combine(Info.Environment["CLAUDE_CONFIG_DIR"]!, "CLAUDE.md");
        if (File.Exists(RulePath))
        {
            Info.ArgumentList.Add("--append-system-prompt-file");
            Info.ArgumentList.Add(RulePath);
        }
    }

    public static ProcessStartInfo TaskInfo(RelayTask Item, string CliPath, bool Resume, string ConfigHome)
    {
        var Info = StartInfo(CliPath, Item.Channel.WorkingDirectory, Item.Channel.WorkerModel, ConfigHome);
        Info.RedirectStandardInput = Info.RedirectStandardOutput = Info.RedirectStandardError = true;
        Info.StandardInputEncoding = Info.StandardOutputEncoding = Info.StandardErrorEncoding = new UTF8Encoding(false);
        Info.CreateNoWindow = true;
        AddSessionOptions(Info);
        var ArgumentList = new List<string> { "--print", "--output-format", "stream-json", "--verbose", Resume ? "--resume" : "--session-id", Item.Channel.WorkerThreadId, "--model", Item.Channel.WorkerModel, "--permission-mode", "default" };
        bool Write = Item.Workspace.Access == "write";
        ArgumentList.AddRange(new[] { "--tools", Write ? "Read,Glob,Grep,Edit,Write" : "Read,Glob,Grep" });
        var DenyList = new[]
        {
            "Read(" + PermissionPath(Path.Combine(DesktopHome, "configLibrary")) + "/**)",
            "Read(" + PermissionPath(Path.Combine(Home, "settings.json")) + ")",
            "Read(" + PermissionPath(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".cc-switch")) + "/**)"
        };
        var AllowList = Item.Workspace.WritePathList.Select(PathValue => "Edit(" + PermissionPath(PathValue) + (Directory.Exists(PathValue) ? "/**)" : ")")).ToArray();
        ArgumentList.AddRange(new[] { "--settings", JsonSerializer.Serialize(new { permissions = new { allow = AllowList, deny = DenyList } }) });
        foreach (string Argument in ArgumentList) Info.ArgumentList.Add(Argument);
        return Info;
    }

    private static string PermissionPath(string PathValue)
    {
        string FullPath = ManagerPaths.Normalize(PathValue);
        if (FullPath.Length < 3 || FullPath[1] != ':' || FullPath.IndexOfAny(new[] { '*', '?', '[', ']', '\r', '\n' }) >= 0)
            throw new InvalidOperationException("Claude Code 需要可精确匹配的本地盘符路径 " + FullPath);
        return "//" + char.ToLowerInvariant(FullPath[0]) + FullPath[2..].Replace('\\', '/').TrimEnd('/');
    }
}
