namespace CodexInstanceManager;

/// <summary>
/// Claude Code 执行端连接与桌面入口 会话由编队或 Codex 主会话调度 本页不列出会话
/// </summary>
public sealed class ClaudePage : UserControl
{
    private readonly ClaudeRelayRunner? Runner;
    private readonly AppTheme Theme;
    private readonly bool PreviewOnly;
    private readonly StudioWrapLabel Status = new() { Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 10, 0, 0) };

    public ClaudePage(ClaudeRelayRunner? Runner, AppTheme Theme, bool PreviewOnly = false)
    {
        SuspendLayout();
        this.Runner = Runner;
        this.Theme = Theme;
        this.PreviewOnly = PreviewOnly;
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Tag = eThemeRole.Background;
        var Scroll = new WheelScrollPanel { Dock = DockStyle.Fill, AutoScroll = true };
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        var Card = StudioCard.Create("Claude Code", "在编队或 Codex 主会话中指定 Claude 执行任务 结果自动回传  ·  执行使用当前 Claude Desktop 网关  ·  模型可按席位指定", out var Body);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        var OpenButton = MainForm.MakeButton("打开 Claude Desktop", (_, _) => Run(ClaudeDesktopDialog.OpenDesktop), true);
        OpenButton.Enabled = !PreviewOnly;
        Actions.Controls.Add(OpenButton);
        Actions.Controls.Add(MainForm.MakeButton("Claude Desktop 设置", (_, _) => Run(ShowDesktopDialog)));
        Actions.Controls.Add(MainForm.MakeButton("检查连接", (_, _) => Run(() =>
        {
            var Report = ClaudeRelayRunner.Doctor();
            Status.Text = string.Join(Environment.NewLine, Report.CheckList.Select(Check => (Check.Passed ? "✓ " : "× ") + Check.Name + " " + Check.Detail));
        })));
        Body.Controls.Add(Actions);
        Body.Controls.Add(Status);
        Column.Controls.Add(Card);
        Scroll.Controls.Add(Column);
        Controls.Add(Scroll);
        Status.Text = Runner is null ? "Claude Code 执行端未启用" : "Claude Code 执行端已启用 · 检查连接确认网关与 CLI 状态";
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private void ShowDesktopDialog()
    {
        using var Dialog = new ClaudeDesktopDialog(PreviewOnly);
        Theme.Apply(Dialog);
        Dialog.HandleCreated += (_, _) => Theme.ApplyTitleBar(Dialog);
        Dialog.ShowDialog(FindForm());
    }

    private void Run(Action Action)
    {
        try { Action(); }
        catch (Exception Error) { Program.LogError(Error); Status.Text = Error.Message; }
    }
}
