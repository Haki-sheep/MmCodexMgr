using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Tomlyn;
using Tomlyn.Model;

namespace CodexInstanceManager;

public sealed class ResponsesCompatProfile
{
    public const string Protocol = "mmcodex-responses-compat-v1";
    public const string FileName = "mmcodex-responses-compat.json";
    public const string LogName = "mmcodex-responses-compat.log";
    private const int StartupTimeoutSeconds = 10;
    private const int HealthTimeoutSeconds = 3;
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Provider { get; set; } = "";
    public string UpstreamUrl { get; set; } = "";
    public int Port { get; set; }
    public string BackupPath { get; set; } = "";
    public string LocalUrl => "http://127.0.0.1:" + Port;

    #region Installation
    public static ResponsesCompatProfile Install(InstanceProfile Instance, string CliPath)
    {
        string ProfilePath = Path.Combine(Instance.HomePath, FileName);
        if (File.Exists(ProfilePath)) { VerifyRouting(Instance); EnsureRunning(Instance, CliPath); return Load(ProfilePath); }
        string ConfigPath = Path.Combine(Instance.HomePath, "config.toml");
        string Original = File.ReadAllText(ConfigPath);
        var Config = Toml.ToModel(Original);
        string Provider = (string)Config["model_provider"];
        var Definition = (TomlTable)((TomlTable)Config["model_providers"])[Provider];
        var Upstream = new Uri((string)Definition["base_url"]);
        if (Upstream.Scheme != "https" || Upstream.Host != "opencode.ai" || Upstream.AbsolutePath.TrimEnd('/') != "/zen/go/v1" || !Upstream.IsDefaultPort || Upstream.Query.Length != 0 || Upstream.UserInfo.Length != 0 || Upstream.Fragment.Length != 0) throw new InvalidOperationException("当前兼容安装仅适用于 OpenCode Go Responses 服务商");
        var Reservation = new TcpListener(IPAddress.Loopback, 0);
        Reservation.Start();
        int Port = ((IPEndPoint)Reservation.LocalEndpoint).Port;
        Reservation.Stop();
        var Profile = new ResponsesCompatProfile { Provider = Provider, UpstreamUrl = Upstream.AbsoluteUri.TrimEnd('/'), Port = Port, BackupPath = ConfigPath + ".before-responses-compat-" + Guid.NewGuid().ToString("N") + ".bak" };
        string Updated = RewriteUrl(Original, Provider, Profile.UpstreamUrl, Profile.LocalUrl);
        File.Copy(ConfigPath, Profile.BackupPath);
        SettingsStore.AtomicWrite(ProfilePath, JsonSerializer.SerializeToUtf8Bytes(Profile));
        try
        {
            EnsureRunning(Instance, CliPath);
            if (File.ReadAllText(ConfigPath) != Original) throw new IOException("服务商配置在安装期间发生变化 请重新核对");
            SettingsStore.AtomicWrite(ConfigPath, Encoding.UTF8.GetBytes(Updated));
        }
        catch { File.Delete(ProfilePath); throw; }
        return Profile;
    }

    public static void Remove(InstanceProfile Instance)
    {
        string ProfilePath = Path.Combine(Instance.HomePath, FileName);
        var Profile = Load(ProfilePath);
        string ConfigPath = Path.Combine(Instance.HomePath, "config.toml");
        string Updated = RewriteUrl(File.ReadAllText(ConfigPath), Profile.Provider, Profile.LocalUrl, Profile.UpstreamUrl);
        SettingsStore.AtomicWrite(ConfigPath, Encoding.UTF8.GetBytes(Updated));
        File.Delete(ProfilePath);
    }

    public static string RewriteUrl(string Text, string Provider, string ExpectedUrl, string NewUrl)
    {
        var Config = Toml.ToModel(Text);
        var Definition = (TomlTable)((TomlTable)Config["model_providers"])[Provider];
        if (((string)Definition["base_url"]).TrimEnd('/') != ExpectedUrl.TrimEnd('/')) throw new InvalidOperationException("服务商地址已变化 无法应用兼容配置 " + Provider);
        var Document = Toml.Parse(Text);
        foreach (var Table in Document.Tables)
        {
            var Header = Toml.ToModel("[" + Table.Name + "]\nprobe=0\n");
            if (!Header.TryGetValue("model_providers", out object? Providers) || Providers is not TomlTable ProviderDict || !ProviderDict.ContainsKey(Provider)) continue;
            foreach (var Entry in Table.Items)
            {
                if (Entry.Key!.ToString().Trim() != "base_url") continue;
                int Start = Entry.Value!.Span.Start.Offset;
                int Length = Entry.Value.Span.End.Offset - Start + 1;
                string Result = Text[..Start] + JsonSerializer.Serialize(NewUrl) + Text[(Start + Length)..];
                var Verified = (TomlTable)((TomlTable)Toml.ToModel(Result)["model_providers"])[Provider];
                if ((string)Verified["base_url"] != NewUrl) throw new InvalidDataException("兼容地址写入验证失败");
                return Result;
            }
        }
        throw new InvalidDataException("服务商必须在独立 TOML 配置节内声明 base_url " + Provider);
    }
    #endregion

    #region Process
    public static ResponsesCompatProfile Load(string ProfilePath)
    {
        var Profile = JsonSerializer.Deserialize<ResponsesCompatProfile>(File.ReadAllBytes(ProfilePath)) ?? throw new InvalidDataException("协议适配配置为空");
        if (Profile.Port is < 1024 or > 65535 || Profile.Id.Length == 0) throw new InvalidDataException("协议适配配置无效");
        return Profile;
    }

    public static ResponsesCompatProfile VerifyRouting(InstanceProfile Instance)
    {
        var Profile = Load(Path.Combine(Instance.HomePath, FileName));
        var Config = Toml.ToModel(File.ReadAllText(Path.Combine(Instance.HomePath, "config.toml")));
        if ((string)Config["model_provider"] != Profile.Provider) throw new InvalidOperationException("当前服务商已切换 协议适配未作用于当前服务商");
        var Definition = (TomlTable)((TomlTable)Config["model_providers"])[Profile.Provider];
        if ((string)Definition["base_url"] != Profile.LocalUrl) throw new InvalidOperationException("当前服务商地址已变化 协议适配未生效 请核对配置");
        return Profile;
    }

    public static void Probe(InstanceProfile Instance)
    {
        var Profile = VerifyRouting(Instance);
        using var Client = new HttpClient(new SocketsHttpHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(HealthTimeoutSeconds) };
        if (!IsReady(Client, Profile)) throw new IOException("协议适配服务未运行");
    }

    public static bool EnsureRunning(InstanceProfile Instance, string CliPath)
    {
        string ProfilePath = Path.Combine(Instance.HomePath, FileName);
        if (!File.Exists(ProfilePath)) return false;
        var Profile = Load(ProfilePath);
        using var Gate = new Mutex(false, "Local\\" + Protocol + "-" + Profile.Id);
        bool Acquired;
        try { Acquired = Gate.WaitOne(TimeSpan.FromSeconds(StartupTimeoutSeconds)); }
        catch (AbandonedMutexException) { Acquired = true; }
        if (!Acquired) throw new TimeoutException("协议适配服务启动锁等待超时");
        try { return StartProcess(Profile, Instance, CliPath, ProfilePath); }
        finally { Gate.ReleaseMutex(); }
    }

    private static bool StartProcess(ResponsesCompatProfile Profile, InstanceProfile Instance, string CliPath, string ProfilePath)
    {
        using var Client = new HttpClient(new SocketsHttpHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(HealthTimeoutSeconds) };
        if (IsReady(Client, Profile)) return false;
        if (!File.Exists(CliPath)) throw new FileNotFoundException("协议适配 CLI 不存在", CliPath);
        var Info = new ProcessStartInfo(CliPath) { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = Path.GetDirectoryName(CliPath)! };
        Info.ArgumentList.Add("compat-server"); Info.ArgumentList.Add("--profile"); Info.ArgumentList.Add(ProfilePath);
        using var Worker = Process.Start(Info) ?? throw new IOException("无法启动协议适配服务");
        var Timer = Stopwatch.StartNew();
        while (Timer.Elapsed < TimeSpan.FromSeconds(StartupTimeoutSeconds))
        {
            if (IsReady(Client, Profile)) return true;
            if (Worker.HasExited) throw new IOException("协议适配服务退出 " + Worker.ExitCode + " 请检查 " + Path.Combine(Instance.HomePath, LogName));
            Thread.Sleep(100);
        }
        throw new TimeoutException("协议适配服务启动超时 请检查 " + Path.Combine(Instance.HomePath, LogName));
    }

    private static bool IsReady(HttpClient Client, ResponsesCompatProfile Profile)
    {
        try
        {
            using var Response = Client.GetAsync(Profile.LocalUrl + "/health").GetAwaiter().GetResult();
            Response.EnsureSuccessStatusCode();
            using var Document = JsonDocument.Parse(Response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult());
            if (Document.RootElement.GetProperty("id").GetString() != Profile.Id || Document.RootElement.GetProperty("protocol").GetString() != Protocol) throw new IOException("协议适配端口已被其他服务占用");
            return true;
        }
        catch (HttpRequestException Error) when (IsConnectionClosed(Error)) { return false; }
    }

    private static bool IsConnectionClosed(Exception Error)
    {
        for (Exception? Current = Error; Current is not null; Current = Current.InnerException)
            if (Current is SocketException Socket && Socket.SocketErrorCode is SocketError.ConnectionRefused or SocketError.ConnectionReset or SocketError.ConnectionAborted) return true;
        return false;
    }
    #endregion
}
