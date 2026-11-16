namespace CodexInstanceManager;

public sealed class AgentIconSettingsCard : StudioCard
{
    private readonly AgentIconSettings Settings;
    private readonly Func<AgentIconSettings, Task> Apply;
    private readonly FlowLayoutPanel Actions = new() { Dock = DockStyle.Top, AutoSize = true, WrapContents = true };
    private readonly Label Status = new() { AutoSize = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption };
    private readonly Dictionary<string, PictureBox> PreviewDict = new();
    private readonly Dictionary<string, Label> PathDict = new();

    public AgentIconSettingsCard(bool PreviewOnly, Func<AgentIconSettings, Task> Apply)
    {
        this.Apply = Apply;
        Settings = PreviewOnly ? new() : AgentIconSettings.Load();
        AutoSize = true;
        Dock = DockStyle.Top;
        var Body = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 1 };
        Body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Body.Controls.Add(new Label { Text = "Agent 图标", AutoSize = true, Font = StudioFonts.Section });
        Body.Controls.Add(new StudioWrapLabel { Text = "按 Agent 设置任务栏和通知区头像 · 运行中的实例会显示序号", Tag = eThemeRole.Muted });
        Body.Controls.Add(Actions);
        foreach (string Provider in AgentIconSettings.ProviderList)
        {
            var Row = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = true };
            var Preview = new PictureBox { Size = new Size(48, 48), SizeMode = PictureBoxSizeMode.Zoom, Margin = new Padding(0, 4, 12, 4) };
            PreviewDict.Add(Provider, Preview);
            Row.Controls.Add(Preview);
            Row.Controls.Add(new Label { Text = AgentDesktopBranding.DisplayName(Provider), Width = 150, AutoSize = false, Height = 42, TextAlign = ContentAlignment.MiddleLeft });
            var Choose = new StudioButton { Text = "选择图片", Enabled = !PreviewOnly };
            Choose.Click += (_, _) => TryAction(() =>
            {
                using var Dialog = new OpenFileDialog { Filter = "图标图片|*.ico;*.png;*.jpg;*.jpeg", Title = "选择 " + Provider + " 图标" };
                if (Dialog.ShowDialog(FindForm()) != DialogResult.OK) return;
                Settings.Import(Provider, Dialog.FileName);
                RefreshPreview(Provider);
                Status.Text = "已选择 点击应用保存并更新所有实例";
            });
            var Reset = new StudioButton { Text = "内置 Q 版", Kind = eButtonKind.Ghost, Enabled = !PreviewOnly };
            Reset.Click += (_, _) => TryAction(() => { Settings.CustomPathDict.Remove(Provider); RefreshPreview(Provider); });
            Row.Controls.Add(Choose);
            Row.Controls.Add(Reset);
            var PathLabel = new Label { AutoSize = true, MaximumSize = new Size(380, 0), Font = StudioFonts.Caption, Tag = eThemeRole.Muted, Margin = new Padding(4, 12, 0, 4) };
            PathDict.Add(Provider, PathLabel);
            Row.Controls.Add(PathLabel);
            Body.Controls.Add(Row);
            RefreshPreview(Provider);
        }
        var ApplyAll = new StudioButton { Text = "一键更换 Agent 图标", Kind = eButtonKind.Primary, Enabled = !PreviewOnly, Name = "ApplyAgentIcons" };
        ApplyAll.Click += async (_, _) => await ApplyAsync(true, false);
        var ApplyCustom = new StudioButton { Text = "应用当前配置", Enabled = !PreviewOnly };
        ApplyCustom.Click += async (_, _) => await ApplyAsync(true, true);
        var Restore = new StudioButton { Text = "恢复软件原图标", Kind = eButtonKind.Ghost, Enabled = !PreviewOnly };
        Restore.Click += async (_, _) => await ApplyAsync(false, true);
        Actions.Controls.AddRange(new Control[] { ApplyAll, ApplyCustom, Restore });
        Body.Controls.Add(Status);
        Controls.Add(Body);
        Status.Text = Settings.Enabled ? "已启用 当前配置会应用到新打开的实例" : "未启用 点击按钮后应用";
    }

    private void RefreshPreview(string Provider)
    {
        var Previous = PreviewDict[Provider].Image;
        PreviewDict[Provider].Image = Settings.Draw(Provider, "1", 64, Color.Teal);
        Previous?.Dispose();
        PathDict[Provider].Text = Settings.CustomPathDict.GetValueOrDefault(Provider) ?? "内置 Q 版头像";
    }

    private async Task ApplyAsync(bool Enabled, bool PreserveCustom)
    {
        Actions.Enabled = false;
        try
        {
            if (!PreserveCustom) Settings.CustomPathDict.Clear();
            Settings.Enabled = Enabled;
            await Apply(Settings.Copy());
            foreach (string Provider in AgentIconSettings.ProviderList) RefreshPreview(Provider);
            Status.Text = Enabled ? "已应用图标配置 后续实例沿用当前配置" : "已恢复软件原图标 并停止自动替换";
        }
        catch (Exception Error) { ShowError(Error); }
        finally { Actions.Enabled = true; }
    }

    private void TryAction(Action Action) { try { Action(); } catch (Exception Error) { ShowError(Error); } }
    private void ShowError(Exception Error) { Program.LogError(Error); Status.Text = Error.Message; }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) foreach (var Preview in PreviewDict.Values) { Preview.Image?.Dispose(); Preview.Image = null; }
        base.Dispose(Disposing);
    }
}
