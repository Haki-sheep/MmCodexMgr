namespace CodexInstanceManager;

public sealed class MainForm : Form
{
    public const string AppTitle = "Mm AgentWork Mgr";
    private readonly ManagerSettings Settings;
    private readonly bool PreviewOnly;
    private readonly AppTheme Theme;
    private readonly ThemeTabControl MainTabs = new() { Dock = DockStyle.Fill };
    private readonly NavigationPage FormationTab = new("编队", char.ConvertFromUtf32(0xE716));
    private readonly NavigationPage AgentTab = new("Agent 管理", char.ConvertFromUtf32(0xE770));
    private readonly NavigationPage LibraryTab = new("Rule + Skill", char.ConvertFromUtf32(0xE8F1));
    /// <summary> 管理器自身的全局设置入口 </summary>
    private readonly NavigationPage SettingsTab = new("设置", char.ConvertFromUtf32(0xE713));
    /// <summary> 实例与外部执行端的统一管理页 </summary>
    private readonly AgentPage Agents;
    /// <summary> 编队首页 </summary>
    private readonly FormationPage Formations;
    /// <summary> 应用与托盘共用图标 由窗体释放 </summary>
    private readonly Icon AppIcon;
    private readonly NotifyIcon TrayIcon = new();
    private readonly BrandingService Branding = new();
    private readonly AgentTaskbarService AgentTaskbar = new();
    private readonly AgentTaskbarProfiles TaskbarProfiles = new();
    private readonly System.Windows.Forms.Timer RefreshDelay = new() { Interval = 150 };
    private readonly InstanceActivityMonitor ActivityMonitor = new();
    private readonly SemaphoreSlim RefreshGate = new(1, 1);
    private List<RunningInstance> RunningList = new();
    private bool RefreshAgain;
    private bool AllowExit;
    private AgentIconSettings AgentIcons;

    #region Layout
    public MainForm(ManagerSettings Settings, bool PreviewOnly = false, RelayStore? TaskStore = null, RelayCoordinator? TaskCoordinator = null, FormationService? Formation = null, FormationStore? FormationData = null)
    {
        SuspendLayout();
        this.Settings = Settings;
        this.PreviewOnly = PreviewOnly;
        AgentIcons = PreviewOnly ? new() : AgentIconSettings.Load();
        Theme = new AppTheme(Settings.DarkMode);
        MainTabs.Theme = Theme;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = AppTitle;
        Font = StudioFonts.Body;
        ClientSize = new Size(1240, 860);
        MinimumSize = new Size(980, 700);
        StartPosition = FormStartPosition.CenterScreen;
        AppIcon = AppArtwork.CreateIcon();
        Icon = AppIcon;

        MainTabs.TabPages.Add(FormationTab);
        MainTabs.TabPages.Add(AgentTab);
        MainTabs.TabPages.Add(LibraryTab);
        MainTabs.TabPages.Add(SettingsTab);
        Formations = new FormationPage(Settings, Formation, FormationData, Theme, PreviewOnly);
        FormationTab.Controls.Add(Formations);
        Agents = new AgentPage(Settings, Theme, PreviewOnly, TaskCoordinator);
        AgentTab.Controls.Add(Agents);
        MainTabs.SelectedTab = FormationTab;
        MainTabs.SelectedIndexChanged += (_, _) => SafeAction(() =>
        {
            if (MainTabs.SelectedTab == LibraryTab) BuildLibraryPage();
            else if (MainTabs.SelectedTab == SettingsTab) BuildSettingsPage();
        });
        MainTabs.ThemeToggleRequested += (_, _) => SafeAction(ToggleTheme);
        Controls.Add(MainTabs);
        HandleCreated += (_, _) => Theme.ApplyTitleBar(this);

        var TrayMenu = new ContextMenuStrip();
        TrayMenu.Items.Add("显示 " + AppTitle, null, (_, _) => ShowManager());
        TrayMenu.Items.Add("刷新实例状态", null, async (_, _) => await RefreshRunningAsync());
        TrayMenu.Items.Add("退出", null, (_, _) => { AllowExit = true; Close(); });
        TrayIcon.Icon = AppIcon;
        TrayIcon.Text = AppTitle;
        TrayIcon.ContextMenuStrip = TrayMenu;
        TrayIcon.Visible = !PreviewOnly;
        TrayIcon.DoubleClick += (_, _) => ShowManager();
        RefreshDelay.Tick += async (_, _) => { RefreshDelay.Stop(); await RefreshRunningAsync(); };
        ActivityMonitor.Changed += QueueInstanceRefresh;
        Activated += (_, _) => { if (!PreviewOnly) QueueInstanceRefresh(); };
        FormClosing += (_, Event) =>
        {
            if (Agents.IsBusy) { Event.Cancel = true; return; }
            if (!AllowExit && Event.CloseReason == CloseReason.UserClosing) { Event.Cancel = true; Hide(); return; }
            if (!PreviewOnly && !Event.Cancel) TaskCoordinator?.BeginShutdown();
        };
        if (!PreviewOnly) Shown += async (_, _) => { SafeAction(ActivityMonitor.Enable); await RefreshRunningAsync(); };
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
        ApplyTheme();
    }

    private void BuildLibraryPage()
    {
        if (LibraryTab.Controls.Count != 0) return;
        var Page = new LibraryPage(Settings, Theme, PreviewOnly);
        Theme.Apply(Page);
        LibraryTab.Controls.Add(Page);
    }

    private void BuildSettingsPage()
    {
        if (SettingsTab.Controls.Count != 0) return;
        var Page = new ManagerSettingsPage(PreviewOnly, null, Dark => SafeAction(() => SetDarkMode(Dark)), () => Settings.DarkMode, ApplyAgentIconsAsync);
        Theme.Apply(Page);
        SettingsTab.Controls.Add(Page);
    }

    public void ShowFormationPage() => MainTabs.SelectedTab = FormationTab;

    public void ShowAgentPage() => MainTabs.SelectedTab = AgentTab;

    public void ShowLibraryPage()
    {
        BuildLibraryPage();
        MainTabs.SelectedTab = LibraryTab;
    }

    public void ShowSettingsPage()
    {
        BuildSettingsPage();
        MainTabs.SelectedTab = SettingsTab;
    }

    private Task ApplyAgentIconsAsync(AgentIconSettings Configuration)
    {
        if (PreviewOnly) throw new InvalidOperationException("预览模式不能修改 Agent 图标");
        return RefreshRunningAsync(Configuration.Copy());
    }

    /// <summary>
    /// 旧 Cursor 入口兼容 定位到 Agent 管理中的 Cursor 卡片
    /// </summary>
    public void ShowHarnessPage()
    {
        ShowAgentPage();
        Agents.ShowAgent(CursorRelayRunner.InstanceId);
    }

    /// <summary>
    /// 旧跨 Agent 协作入口兼容 已合并到 Agent 管理
    /// </summary>
    public void ShowCollaborationPage() => ShowAgentPage();

    /// <summary>
    /// 旧任务看板入口兼容 看板视图已移除 转到编队首页
    /// </summary>
    public void ShowRelayPage() => ShowFormationPage();

    public static Button MakeButton(string Text, EventHandler Handler, bool Primary = false)
    {
        var Button = new StudioButton { Text = Text, Kind = Primary ? eButtonKind.Primary : eButtonKind.Secondary };
        Button.Click += Handler;
        return Button;
    }
    #endregion

    #region Appearance
    private void ToggleTheme() => SetDarkMode(!Settings.DarkMode);

    private void SetDarkMode(bool Dark)
    {
        Settings.DarkMode = Dark;
        if (!PreviewOnly) SettingsStore.Save(Settings);
        ApplyTheme();
    }

    private void ApplyTheme()
    {
        Theme.SetDark(Settings.DarkMode);
        Theme.Apply(this);
    }
    #endregion

    #region Actions
    public async Task HandleCommandAsync(string Command)
    {
        if (Command is "apply-icons" or "restore-icons")
        {
            var Configuration = AgentIconSettings.Load();
            Configuration.Enabled = Command == "apply-icons";
            await ApplyAgentIconsAsync(Configuration);
            return;
        }
        if (Command == "show") { ShowManager(); return; }
        if (Command == "relay") { ShowFormationPage(); ShowManager(); return; }
        if (Command == "harness") { ShowHarnessPage(); ShowManager(); return; }
        if (Command == "collaboration") { ShowAgentPage(); ShowManager(); return; }
        if (Command == "library") { ShowLibraryPage(); ShowManager(); return; }
        var Profile = Settings.InstanceList.FirstOrDefault(Item => Item.Id == Command) ?? throw new InvalidOperationException("找不到指定实例 " + Command);
        ShowAgentPage();
        try { await Agents.LaunchAsync(Profile); }
        catch (Exception Error)
        {
            Program.LogError(Error);
            Agents.SetStatus(Error.Message);
            MessageBox.Show(this, Error.Message, "操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        await RefreshRunningAsync();
    }

    private void ShowManager() { Show(); WindowState = FormWindowState.Normal; Activate(); }

    private async Task RefreshRunningAsync(AgentIconSettings? Configuration = null)
    {
        if (Configuration is not null) await RefreshGate.WaitAsync();
        else if (!RefreshGate.Wait(0)) { RefreshAgain = true; return; }
        try
        {
            var Snapshot = await Task.Run(() => (Codex: InstanceService.ListRunning(), External: AgentDesktopBranding.ListRunning()));
            RunningList = Snapshot.Codex;
            if (IsDisposed || Disposing) return;
            Agents.UpdateRunning(RunningList);
            if (PreviewOnly) return;
            ActivityMonitor.Track(RunningList.Concat(Snapshot.External.SelectMany(Item => Item.WindowList.Count == 0
                ? new[] { new RunningInstance(Item.ProcessId, "", IntPtr.Zero) }
                : Item.WindowList.Select(Window => new RunningInstance(Item.ProcessId, "", Window)))).ToList());
            if (Configuration is not null)
            {
                AgentIconShortcuts.RestoreLegacy();
                Configuration.Save();
                AgentIcons = Configuration;
            }
            if (!AgentIcons.Enabled && Configuration is null) return;

            var TrayTargetList = new List<AgentTrayTarget>();
            var WindowTargetList = new List<AgentIconTarget>();
            var IconProfileList = await TaskbarProfiles.ResolvedAsync(Settings.InstanceList, RunningList, Configuration is not null);
            if (IsDisposed || Disposing) return;
            foreach (var Profile in IconProfileList)
            {
                var Running = InstanceService.Find(Profile, RunningList);
                if (Running is null) continue;
                try
                {
                    using var Process = System.Diagnostics.Process.GetProcessById(Running.ProcessId);
                    long StartedAt = Process.StartTime.ToUniversalTime().Ticks;
                    TrayTargetList.Add(new("codex", Profile, Running.ProcessId, StartedAt));
                    if (Running.Window != IntPtr.Zero) WindowTargetList.Add(new("codex", Profile, Running.ProcessId, StartedAt, Running.Window));
                }
                catch (ArgumentException) { }
            }
            foreach (var Desktop in Snapshot.External)
            {
                TrayTargetList.Add(new(Desktop.Provider, Desktop.Profile, Desktop.ProcessId, Desktop.StartedAt));
                foreach (var Window in Desktop.WindowList)
                    WindowTargetList.Add(new(Desktop.Provider, Desktop.Profile, Desktop.ProcessId, Desktop.StartedAt, Window));
            }
            if (AgentIcons.Enabled)
            {
                var BrandedList = WindowTargetList.Select(Target => Target with { Profile = AgentIcons.Branded(Target.Profile, Target.Provider) }).ToList();
                foreach (var Target in BrandedList) Branding.Apply(Target.Profile, Target.Window, Target.Provider, Target.ProcessId, Target.StartedAt);
                await AgentTaskbar.UpdateAsync(BrandedList.Where(Target => InstanceWindowService.IsVisible(Target.Window)).ToList());
                if (IsDisposed || Disposing) return;
            }
            else
            {
                await AgentTaskbar.UpdateAsync(Array.Empty<AgentIconTarget>());
                if (IsDisposed || Disposing) return;
                Branding.RestoreNative(WindowTargetList.Select(Target => Target.Window));
                AgentTrayOriginal.RestoreLegacyFiles();
            }
            await Task.Run(() => AgentTrayBranding.Apply(AgentIcons, TrayTargetList));
        }
        catch (Exception Error) when (Configuration is null) { Agents.SetStatus("刷新实例状态失败 " + Error.Message); Program.LogError(Error); }
        finally { RefreshGate.Release(); if (RefreshAgain) { RefreshAgain = false; QueueInstanceRefresh(); } }
    }

    private void QueueInstanceRefresh()
    {
        if (PreviewOnly || IsDisposed || !IsHandleCreated) return;
        if (InvokeRequired)
        {
            try { BeginInvoke(QueueInstanceRefresh); }
            catch (InvalidOperationException) when (IsDisposed || Disposing || !IsHandleCreated) { }
            return;
        }
        RefreshDelay.Stop();
        RefreshDelay.Start();
    }

    private void SafeAction(Action Action)
    {
        try { Action(); }
        catch (Exception Error)
        {
            Program.LogError(Error);
            MessageBox.Show(this, Error.Message, "操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing)
        {
            RefreshDelay.Stop();
            RefreshDelay.Dispose();
            ActivityMonitor.Changed -= QueueInstanceRefresh;
            ActivityMonitor.Dispose();
            AgentTaskbar.Dispose();
            Branding.Dispose();
            TrayIcon.Dispose();
        }
        base.Dispose(Disposing);
        if (Disposing) AppIcon.Dispose();
    }
    #endregion
}
