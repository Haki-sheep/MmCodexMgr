namespace CodexInstanceManager;

/// <summary>
/// Antigravity App 桌面联调连接检查 会话由编队或 Codex 主会话调度 本页不列出会话
/// </summary>
public sealed class AntigravityPage : UserControl
{
    private readonly StudioWrapLabel Status = new() { Tag = eThemeRole.Muted, Font = StudioFonts.Caption, Margin = new Padding(0, 10, 0, 0) };
    private readonly CancellationTokenSource Lifetime = new();
    private bool Busy;

    public AntigravityPage(bool PreviewOnly = false)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Font = StudioFonts.Body;
        Dock = DockStyle.Fill;
        Tag = eThemeRole.Background;
        var Scroll = new WheelScrollPanel { Dock = DockStyle.Fill, AutoScroll = true };
        var Column = new TableLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, ColumnCount = 1, Padding = new Padding(0, 0, 6, 0) };
        Column.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        var Card = StudioCard.Create("Antigravity", "桌面 App 联调  ·  执行沿用 Antigravity 会话配置 不在编队中指定模型  ·  工作目录按席位指定", out var Body);
        var Actions = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Margin = Padding.Empty };
        Actions.Controls.Add(MainForm.MakeButton("检查连接", async (_, _) => await CheckAsync(), true));
        Body.Controls.Add(Actions);
        Body.Controls.Add(Status);
        Column.Controls.Add(Card);
        Scroll.Controls.Add(Column);
        Controls.Add(Scroll);
        Status.Text = PreviewOnly ? "预览模式 · 检查连接只读取 Antigravity App 状态" : "启动 Antigravity App 后点击检查连接";
        ResumeLayout(false);
        PerformAutoScale();
        PerformLayout();
    }

    private async Task CheckAsync()
    {
        if (Busy) return;
        Busy = true;
        Status.Text = "正在连接 Antigravity App…";
        try
        {
            using var Client = AntigravityDesktopClient.Connect();
            var SessionList = await Client.SessionsAsync(Lifetime.Token);
            if (!IsDisposed) Status.Text = $"已连接 Antigravity App  ·  本地会话 {SessionList.Count} 个  ·  {SessionList.Count(Session => Session.Running)} 个执行中";
        }
        catch (OperationCanceledException) when (Lifetime.IsCancellationRequested) { }
        catch (Exception Error)
        {
            Program.LogError(Error);
            if (!IsDisposed) Status.Text = Error.Message;
        }
        finally { Busy = false; }
    }

    protected override void Dispose(bool Disposing)
    {
        if (Disposing) { Lifetime.Cancel(); Lifetime.Dispose(); }
        base.Dispose(Disposing);
    }
}
