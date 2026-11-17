using System.IO.Pipes;
using System.Text;

namespace CodexInstanceManager;

public static class Program
{
    private static readonly string PipeName = "CodexInstanceManager-" + Environment.UserName;
    private static readonly object ErrorLogGate = new();

    [STAThread]
    public static void Main(string[] ArgumentList)
    {
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--relay-mcp")
        {
            try { RelayMcp.RunAsync(ArgumentList[1], Console.OpenStandardInput(), Console.OpenStandardOutput(), CancellationToken.None).GetAwaiter().GetResult(); }
            catch (Exception Error) { Console.Error.WriteLine(Error); Environment.ExitCode = 1; }
            return;
        }
        RunDesktop(ArgumentList);
    }

    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static void RunDesktop(string[] ArgumentList)
    {
        ApplicationConfiguration.Initialize();
        if (ArgumentList is ["--agent-taskbar-button", var ButtonRequest])
        {
            try { AgentTaskbarButton.Run(ButtonRequest); }
            catch (Exception Error) { LogError(Error); Environment.ExitCode = 1; }
            return;
        }
        if (ArgumentList is ["--agent-taskbar-profiles", var ProfileRequest])
        {
            try { AgentTaskbarProfiles.Respond(ProfileRequest); }
            catch (Exception Error) { LogError(Error); Environment.ExitCode = 1; }
            return;
        }
        try
        {
            if (ArgumentList.Length is 2 or 3 && ArgumentList[0] is "--render-preview" or "--render-formation-preview" or "--render-agent-preview" or "--render-relay-preview" or "--render-harness-preview" or "--render-library-preview")
            {
                if (ArgumentList.Length == 3 && ArgumentList[2] is not ("--light" or "--dark")) throw new ArgumentException("预览主题必须为 --light 或 --dark");
                string PreviewRoot = Path.Combine(Path.GetTempPath(), "CodexManagerRelayPreview-" + Guid.NewGuid().ToString("N"));
                try
                {
                    var PreviewStore = new RelayStore(PreviewRoot);
                    using var PreviewCoordinator = new RelayCoordinator(PreviewStore, new DesktopRelayBridge());
                    var PreviewSettings = SettingsStore.Load();
                    if (ArgumentList.Length == 3) PreviewSettings.DarkMode = ArgumentList[2] == "--dark";
                    var PreviewFormations = new FormationStore(Path.Combine(PreviewRoot, "formation"));
                    var PreviewFormation = new FormationService(PreviewFormations, PreviewSettings);
                    using var Preview = new MainForm(PreviewSettings, true, PreviewStore, PreviewCoordinator, PreviewFormation, PreviewFormations);
                    if (ArgumentList[0] is "--render-relay-preview" or "--render-formation-preview") Preview.ShowFormationPage();
                    if (ArgumentList[0] is "--render-harness-preview" or "--render-agent-preview") Preview.ShowAgentPage();
                    if (ArgumentList[0] == "--render-library-preview") Preview.ShowLibraryPage();
                    Preview.Show();
                    Application.DoEvents();
                    using var Bitmap = new Bitmap(Preview.Width, Preview.Height);
                    Preview.DrawToBitmap(Bitmap, new Rectangle(0, 0, Preview.Width, Preview.Height));
                    Bitmap.Save(ArgumentList[1]);
                    File.WriteAllText(ArgumentList[1] + ".json", System.Text.Json.JsonSerializer.Serialize(new { Preview.DeviceDpi, Preview.CurrentAutoScaleDimensions, Preview.AutoScaleDimensions, FontHeight = Preview.Font.Height, Controls = DescribeLayout(Preview) }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
                }
                finally
                {
                    if (!ManagerPaths.IsUnder(PreviewRoot, Path.GetTempPath())) throw new IOException("预览清理路径越界");
                    if (Directory.Exists(PreviewRoot)) Directory.Delete(PreviewRoot, true);
                }
                return;
            }
            string Command = ArgumentList.Length == 2 && ArgumentList[0] == "--launch" ? ArgumentList[1] : ArgumentList.Contains("--formation") || ArgumentList.Contains("--board") || ArgumentList.Contains("--relay") ? "relay" : ArgumentList.Contains("--agents") || ArgumentList.Contains("--collaboration") ? "collaboration" : ArgumentList.Contains("--harness") || ArgumentList.Contains("--cursor") ? "harness" : ArgumentList.Contains("--library") ? "library" : "show";
            if (ArgumentList.Contains("--apply-agent-icons")) Command = "apply-icons";
            if (ArgumentList.Contains("--restore-agent-icons")) Command = "restore-icons";
            bool Background = ArgumentList.Contains("--background");
            using var Mutex = new Mutex(true, "Local\\" + PipeName, out bool Created);
            if (!Created)
            {
                if (Background) return;
                using var Client = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
                Client.Connect(4000);
                using var Writer = new StreamWriter(Client, new UTF8Encoding(false)) { AutoFlush = true };
                Writer.WriteLine(Command);
                return;
            }
            var TaskStore = new RelayStore(RelayLimits.Root);
            string CliPath = AgentCliDeployment.LoadPath();
            var Channel = TaskStore.LoadChannel();
            if (Channel is not null && Channel.CallbackCliPath.Length != 0 && !ManagerPaths.Same(Channel.CallbackCliPath, CliPath))
            {
                Channel.CallbackCliPath = CliPath;
                TaskStore.SaveChannel(Channel);
            }
            using var DesktopBridge = new DesktopRelayBridge();
            using var CompatSupervisor = new ResponsesCompatSupervisor(SettingsStore.Load, CliPath, LogError);
            using var Cursor = new CursorRelayRunner();
            using var Dsh = new DshRelayRunner();
            using var Coordinator = new RelayCoordinator(TaskStore, DesktopBridge, Cursor, Dsh, new ClaudeRelayRunner(), Antigravity: new AntigravityRelayRunner());
            using var Cancellation = new CancellationTokenSource();
            var RecoveryCancellation = Cancellation.Token;
            var Catalog = new AgentCatalog();
            var AgentService = new AgentManagementService(TaskStore, Coordinator, Catalog, CliPath);
            var FormationStore = new FormationStore(Path.Combine(ManagerPaths.Root, "formation"));
            var Formation = new FormationService(FormationStore, SettingsStore.Load, AgentService, TaskStore, Catalog,
                Notify: (Run, Prompt) => SendFormationMessageAsync(DesktopBridge, Run, Prompt, false, RecoveryCancellation),
                Activate: (Run, Prompt, Token) => SendFormationMessageAsync(DesktopBridge, Run, Prompt, true, Token));
            FormationOperatorCredential.Save(Formation.IssueOperatorCredential());
            using var Form = new MainForm(SettingsStore.Load(), false, TaskStore, Coordinator, Formation, FormationStore);
            if (Background) { Form.WindowState = FormWindowState.Minimized; Form.ShowInTaskbar = false; }
            using var Relay = new RelayHost(Coordinator, AgentService: AgentService, Formation: Formation);
            Relay.Failed += Error => { if (!Form.IsDisposed && Form.IsHandleCreated) Form.BeginInvoke(() => MessageBox.Show(Form, Error.Message, "联调服务不可用")); };
            void ScheduleFormation() => _ = Task.Run(() => ProcessFormationAsync(Formation, RecoveryCancellation), RecoveryCancellation);
            Coordinator.Changed += ScheduleFormation;
            Formation.Changed += ScheduleFormation;
            Form.Shown += async (_, _) =>
            {
                if (Background) { Form.Hide(); Form.ShowInTaskbar = true; }
                else if (Command != "show") { Form.Hide(); await Form.HandleCommandAsync(Command); }
                _ = Task.Run(() => RecoverReportsAsync(Coordinator, Form, RecoveryCancellation));
                ScheduleFormation();
            };
            _ = ListenAsync(Form, Cancellation.Token);
            Application.Run(Form);
            Coordinator.Changed -= ScheduleFormation;
            Formation.Changed -= ScheduleFormation;
            Cancellation.Cancel();
        }
        catch (Exception Error) { LogError(Error); MessageBox.Show(Error.Message, MainForm.AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error); Environment.ExitCode = 1; }
    }

    private static async Task ProcessFormationAsync(FormationService Formation, CancellationToken Cancellation)
    {
        try { await Formation.ProcessResultsAsync(Cancellation); }
        catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
        catch (Exception Error) { LogError(Error); }
    }

    private static async Task SendFormationMessageAsync(DesktopRelayBridge Bridge, FormationRun Run, string Prompt, bool Start, CancellationToken Cancellation)
    {
        var Controller = Run.MemberList.Single(Member => Member.Role == eFormationRole.Coordinator);
        var Profile = AgentManagementService.ResolveInstance(SettingsStore.Load(), Controller.InstanceId);
        if (Start)
        {
            string CliPath = AgentCliDeployment.LoadPath();
            if (!File.Exists(CliPath)) throw new FileNotFoundException("编队启动需要同目录的 AIMoreMoreWork CLI", CliPath);
            await DesktopRelayBridge.EnsureAvailableAsync(Profile, Cancellation);
        }
        string Thinking = FormationModelOptions.ResolveEffort(Profile, Controller.Model, Controller.Effort, UseInstanceDefault: false);
        await Bridge.SendToRunningAsync(Profile, Controller.SessionId, Prompt, Controller.Model, Thinking, Cancellation);
    }

    private static async Task ListenAsync(MainForm Form, CancellationToken Cancellation)
    {
        while (!Cancellation.IsCancellationRequested)
        {
            try
            {
                await using var Server = new NamedPipeServerStream(PipeName, PipeDirection.In, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
                await Server.WaitForConnectionAsync(Cancellation);
                using var Reader = new StreamReader(Server, Encoding.UTF8);
                string? Command = await Reader.ReadLineAsync(Cancellation);
                if (Command is not null) Form.BeginInvoke(async () => { try { await Form.HandleCommandAsync(Command); } catch (Exception Error) { LogError(Error); MessageBox.Show(Form, Error.Message, "实例操作失败"); } });
            }
            catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { return; }
            catch (Exception Error) { LogError(Error); return; }
        }
    }

    public static void LogError(Exception Error)
    {
        lock (ErrorLogGate)
        {
            Directory.CreateDirectory(ManagerPaths.Root);
            File.AppendAllText(Path.Combine(ManagerPaths.Root, "errors.log"), DateTime.Now.ToString("O") + Environment.NewLine + Error + Environment.NewLine);
        }
    }

    private static async Task RecoverReportsAsync(RelayCoordinator Coordinator, MainForm Form, CancellationToken Cancellation)
    {
        using var Timer = new PeriodicTimer(TimeSpan.FromSeconds(3));
        bool Initial = true;
        try
        {
            do
            {
                try
                {
                    if (Initial) Coordinator.StartQueuedReturns();
                    var Result = await RelayOutbox.ReplayOnceAsync(Coordinator, Cancellation, WaitForNotification: false);
                    if (Initial && Result.Recovered + Result.Failed > 0 && !Form.IsDisposed && Form.IsHandleCreated)
                        Form.BeginInvoke(() => MessageBox.Show(Form, "已恢复 " + Result.Recovered + " 条本地回报\n待核对 " + Result.Failed + " 条 详情保留在发件箱和错误日志中", "联调结果恢复"));
                }
                catch (Exception Error) when (!Cancellation.IsCancellationRequested) { LogError(Error); }
                Initial = false;
            }
            while (await Timer.WaitForNextTickAsync(Cancellation));
        }
        catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
    }

    private static object[] DescribeLayout(Control Parent) => Parent.Controls.Cast<Control>().Select(Control => new { Type = Control.GetType().Name, Control.Text, Bounds = Control.Bounds.ToString(), Control.PreferredSize, Font = Control.Font.ToString(), Control.Visible, Children = DescribeLayout(Control) }).Cast<object>().ToArray();
}
