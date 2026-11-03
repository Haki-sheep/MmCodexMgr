using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;

namespace CodexInstanceManager;

internal static class PackagedAppLauncher
{
    private static string ManifestPath(string AppPath) => Path.Combine(Path.GetDirectoryName(Path.GetDirectoryName(AppPath))!, "AppxManifest.xml");

    public static bool IsPackaged(string AppPath) => File.Exists(ManifestPath(AppPath));

    public static int Launch(string AppPath, InstanceProfile Profile)
    {
        var Manifest = XDocument.Load(ManifestPath(AppPath));
        var Package = Manifest.Root ?? throw new InvalidDataException("应用包清单为空");
        var Identity = Package.Elements().Single(Item => Item.Name.LocalName == "Identity");
        string PackageRoot = Path.GetDirectoryName(ManifestPath(AppPath))!;
        string PackageFamily = Identity.Attribute("Name")!.Value + "_" + Path.GetFileName(PackageRoot).Split('_')[^1];
        var Application = Package.Descendants().Single(Item => Item.Name.LocalName == "Application" &&
            string.Equals(Path.GetFullPath(Path.Combine(PackageRoot, Item.Attribute("Executable")!.Value)), AppPath, StringComparison.OrdinalIgnoreCase));
        string AppId = Application.Attribute("Id")!.Value;
        string ResultPath = Path.Combine(ManagerPaths.Root, "launch-" + Guid.NewGuid().ToString("N") + ".json");
        Directory.CreateDirectory(ManagerPaths.Root);
        if (!Profile.IsPrimary) Directory.CreateDirectory(Profile.DataPath);
        string DataSetup = Profile.IsPrimary ? "" : "$Info.EnvironmentVariables['CODEX_ELECTRON_USER_DATA_PATH']=" + Quote(Profile.DataPath) + "; $Info.Arguments=" + Quote("--user-data-dir=\"" + Profile.DataPath + "\"") + ";";
        // 在包身份内设置环境变量 避免激活代理丢弃实例目录
        string InnerScript = "$Result=& { " + """
            $ErrorActionPreference='Stop';
            try {
                $Info=New-Object System.Diagnostics.ProcessStartInfo;
                $Info.UseShellExecute=$false;
                foreach($Key in @($Info.EnvironmentVariables.Keys)) {
                    if($Key.StartsWith('CODEX_') -or $Key -in @('OPENAI_API_KEY','ELECTRON_RUN_AS_NODE','NODE_OPTIONS','NODE_CHANNEL_FD')) { $Info.EnvironmentVariables.Remove($Key) }
                }
            """ + "$Info.FileName=" + Quote(AppPath) + "; $Info.WorkingDirectory=" + Quote(Path.GetDirectoryName(AppPath)!) + "; $Info.EnvironmentVariables['CODEX_HOME']=" + Quote(Profile.HomePath) + ";" + DataSetup + """
                $Started=[System.Diagnostics.Process]::Start($Info);
                @{processId=$Started.Id} | ConvertTo-Json -Compress
            } catch { @{error=$_.Exception.ToString()} | ConvertTo-Json -Compress }
            """ + " }; $Result | Set-Content -LiteralPath " + Quote(ResultPath + ".tmp") + " -Encoding UTF8; Move-Item -LiteralPath " + Quote(ResultPath + ".tmp") + " -Destination " + Quote(ResultPath);
        string InnerArguments = "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand " + Encode(InnerScript);
        string OuterScript = "$ErrorActionPreference='Stop'; Invoke-CommandInDesktopPackage -PackageFamilyName " + Quote(PackageFamily) + " -AppId " + Quote(AppId) + " -Command powershell.exe -Args " + Quote(InnerArguments) + " -PreventBreakaway";
        var Activation = new ProcessStartInfo("powershell.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        Activation.ArgumentList.Add("-NoProfile");
        Activation.ArgumentList.Add("-NonInteractive");
        Activation.ArgumentList.Add("-EncodedCommand");
        Activation.ArgumentList.Add(Encode(OuterScript));
        try
        {
            using var Process = System.Diagnostics.Process.Start(Activation) ?? throw new IOException("无法启动应用包激活器");
            var Output = Process.StandardOutput.ReadToEndAsync();
            var Error = Process.StandardError.ReadToEndAsync();
            if (!Process.WaitForExit(15000)) throw new TimeoutException("应用包激活器超时 请核对目标实例是否已经启动");
            string Details = Error.GetAwaiter().GetResult();
            Output.GetAwaiter().GetResult();
            if (Process.ExitCode != 0) throw new IOException("应用包激活失败 " + Details);
            var Timer = Stopwatch.StartNew();
            while (Timer.Elapsed < TimeSpan.FromSeconds(15))
            {
                if (!File.Exists(ResultPath)) { Thread.Sleep(100); continue; }
                using var Result = JsonDocument.Parse(File.ReadAllText(ResultPath));
                if (Result.RootElement.TryGetProperty("error", out var Failure)) throw new IOException("包内实例启动失败 " + Failure.GetString());
                return Result.RootElement.GetProperty("processId").GetInt32();
            }
            throw new TimeoutException("未收到包内启动结果 请核对目标实例是否已经启动");
        }
        finally
        {
            if (File.Exists(ResultPath)) File.Delete(ResultPath);
            if (File.Exists(ResultPath + ".tmp")) File.Delete(ResultPath + ".tmp");
        }
    }

    private static string Quote(string Text) => "'" + Text.Replace("'", "''") + "'";

    private static string Encode(string Text) => Convert.ToBase64String(Encoding.Unicode.GetBytes(Text));
}
