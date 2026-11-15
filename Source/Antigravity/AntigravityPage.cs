namespace CodexInstanceManager;

public sealed class AntigravityPage : UserControl
{
    private readonly DataGridView Sessions = new()
    {
        Dock = DockStyle.Fill, ReadOnly = true, AutoGenerateColumns = false, RowHeadersVisible = false,
        AllowUserToAddRows = false, AllowUserToDeleteRows = false, SelectionMode = DataGridViewSelectionMode.FullRowSelect
    };
    private readonly Label Status = new() { AutoSize = true };

    public AntigravityPage()
    {
        Dock = DockStyle.Fill;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new(0, 8, 0, 0) };
        Root.RowStyles.Add(new(SizeType.AutoSize));
        Root.RowStyles.Add(new(SizeType.Percent, 100));
        var Toolbar = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true };
        var RefreshButton = MainForm.MakeButton("刷新桌面会话", async (Sender, _) => await RefreshSessionsAsync((Button)Sender!));
        Toolbar.Controls.Add(RefreshButton);
        Toolbar.Controls.Add(Status);
        Sessions.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "会话", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        Sessions.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "状态", Width = 80 });
        Sessions.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "会话 ID", Width = 285 });
        Sessions.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "工作目录", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        Root.Controls.Add(Toolbar);
        Root.Controls.Add(Sessions);
        Controls.Add(Root);
    }

    private async Task RefreshSessionsAsync(Button RefreshButton)
    {
        RefreshButton.Enabled = false;
        Sessions.Rows.Clear();
        Status.Text = "正在读取 Antigravity App";
        try
        {
            using var Client = AntigravityDesktopClient.Connect();
            var SessionList = await Client.SessionsAsync(CancellationToken.None);
            if (IsDisposed) return;
            foreach (var Session in SessionList) Sessions.Rows.Add(Session.Title, Session.Running ? "执行中" : "空闲", Session.Id, Session.Cwd);
            Status.Text = $"{SessionList.Count} 个本地会话";
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            if (!IsDisposed) Status.Text = Error.Message;
        }
        finally { if (!IsDisposed) RefreshButton.Enabled = true; }
    }
}
