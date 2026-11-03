using System.Management;
using System.Net;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace CodexInstanceManager;

public sealed class DshSettings
{
    public string HomePath { get; set; } = "";
    public string ServerUrl { get; set; } = "";
}

public sealed record DshConnection(string HomePath, Uri Origin);
public sealed record DshHost(int ProcessId, string HomePath);

public static class DshDiscovery
{
    #region Discovery
    public static DshConnection Resolve(DshSettings Settings)
    {
        string? RequestedHome = NonEmpty(Settings.HomePath) ?? NonEmpty(Environment.GetEnvironmentVariable("DSH_HOME"));
        string? RequestedUrl = NonEmpty(Settings.ServerUrl) ?? NonEmpty(Environment.GetEnvironmentVariable("DSH_SERVER_URL"));
        var HostList = RequestedHome is not null && RequestedUrl is not null ? new List<DshHost>() : Hosts();
        string Home = ResolveHome(RequestedHome, HostList);
        if (RequestedUrl is not null) return new(Home, ValidateOrigin(RequestedUrl));
        var HostHashList = HostList.Where(Host => ManagerPaths.Same(Host.HomePath, Home)).Select(Host => Host.ProcessId).ToHashSet();
        var PortList = ListeningPorts(HostHashList).Distinct().ToList();
        if (PortList.Count != 1) throw new InvalidOperationException(PortList.Count == 0
            ? "未找到此 DSH_HOME 对应的桌面服务 请先启动 DeepSeek Harness 或配置本机 ServerUrl " + Home
            : "发现多个 DSH 桌面服务 请配置准确的 ServerUrl 与 HomePath");
        return new(Home, new Uri("http://127.0.0.1:" + PortList[0]));
    }

    public static string ResolveHome(string? Requested, IReadOnlyList<DshHost> HostList)
    {
        if (Requested is not null) return ManagerPaths.Normalize(Requested);
        var HomeList = HostList.Select(Host => ManagerPaths.Normalize(Host.HomePath)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (HomeList.Count > 1) throw new InvalidOperationException("运行中的 DSH 使用多个数据目录 请配置 HomePath 或 DSH_HOME");
        return HomeList.SingleOrDefault() ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".dsh");
    }

    public static Uri ValidateOrigin(string Value)
    {
        if (!Uri.TryCreate(Value, UriKind.Absolute, out var Origin) || Origin.Scheme is not ("http" or "https") ||
            !IPAddress.TryParse(Origin.Host.Trim('[', ']'), out var Address) || !IPAddress.IsLoopback(Address) ||
            Origin.AbsolutePath != "/" || Origin.UserInfo.Length != 0 || Origin.Query.Length != 0 || Origin.Fragment.Length != 0)
            throw new InvalidOperationException("DSH ServerUrl 必须是仅含协议 地址和端口的本机回环 IP 地址");
        return Origin;
    }

    public static DshHost? ParseHost(int ProcessId, string CommandLine)
    {
        var ArgumentList = Regex.Matches(CommandLine, "\"([^\"]*)\"|([^\\s]+)").Select(Match => Match.Groups[1].Success ? Match.Groups[1].Value : Match.Groups[2].Value).ToList();
        int Entry = ArgumentList.FindIndex(Argument => Argument.Replace('\\', '/').EndsWith("/@deepseek-ai/dsh-desktop-host/lib/index.js", StringComparison.OrdinalIgnoreCase));
        if (Entry < 0 || Entry + 2 >= ArgumentList.Count) return null;
        string Profile = ManagerPaths.Normalize(ArgumentList[Entry + 2]);
        var Profiles = Directory.GetParent(Profile);
        if (Profiles?.Name != "profiles" || Profiles.Parent is null) throw new InvalidDataException("无法从 DSH 桌面进程解析数据目录 请配置 HomePath");
        return new(ProcessId, Profiles.Parent.FullName);
    }

    private static string? NonEmpty(string? Value) => string.IsNullOrWhiteSpace(Value) ? null : Value;

    private static List<DshHost> Hosts()
    {
        using var Searcher = new ManagementObjectSearcher("SELECT ProcessId,CommandLine FROM Win32_Process WHERE Name='DeepSeek Harness.exe'");
        using var ProcessList = Searcher.Get();
        var ResultList = new List<DshHost>();
        foreach (ManagementObject Process in ProcessList)
        {
            using (Process)
            {
                var Host = ParseHost(Convert.ToInt32(Process["ProcessId"]), Process["CommandLine"] as string ?? "");
                if (Host is not null) ResultList.Add(Host);
            }
        }
        return ResultList;
    }
    #endregion

    #region Native
    private static List<int> ListeningPorts(HashSet<int> ProcessHashList)
    {
        int Length = 0;
        uint Result = GetExtendedTcpTable(IntPtr.Zero, ref Length, false, 2, 3, 0);
        if (Result != 122 && Result != 0) throw new System.ComponentModel.Win32Exception((int)Result);
        var Buffer = Marshal.AllocHGlobal(Length);
        try
        {
            Result = GetExtendedTcpTable(Buffer, ref Length, false, 2, 3, 0);
            if (Result != 0) throw new System.ComponentModel.Win32Exception((int)Result);
            int Count = Marshal.ReadInt32(Buffer);
            var PortList = new List<int>();
            for (int Index = 0; Index < Count; Index++)
            {
                var Row = IntPtr.Add(Buffer, 4 + Index * 24);
                if (Marshal.ReadInt32(Row) != 2 || !ProcessHashList.Contains(Marshal.ReadInt32(Row, 20))) continue;
                var Address = new IPAddress(unchecked((uint)Marshal.ReadInt32(Row, 4)));
                if (!IPAddress.IsLoopback(Address)) continue;
                int Port = (Marshal.ReadByte(Row, 8) << 8) | Marshal.ReadByte(Row, 9);
                PortList.Add(Port);
            }
            return PortList;
        }
        finally { Marshal.FreeHGlobal(Buffer); }
    }

    [DllImport("iphlpapi.dll")]
    private static extern uint GetExtendedTcpTable(IntPtr Table, ref int Size, bool Order, int Family, int Class, uint Reserved);
    #endregion
}
