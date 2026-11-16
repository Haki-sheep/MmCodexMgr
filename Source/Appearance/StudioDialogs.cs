namespace CodexInstanceManager;

/// <summary>
/// 统一对话框骨架 内容区单列 底部操作右对齐
/// </summary>
public class StudioDialog : Form
{
    protected TableLayoutPanel Content { get; }
    protected FlowLayoutPanel Footer { get; }

    public StudioDialog(string Title, Size Client)
    {
        SuspendLayout();
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        Text = Title;
        Font = StudioFonts.Body;
        ClientSize = Client;
        MinimumSize = new Size(Math.Min(Client.Width, 520), Math.Min(Client.Height, 260));
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        MaximizeBox = false;
        ShowInTaskbar = false;
        var Root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(22, 18, 22, 16) };
        Root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, Margin = Padding.Empty };
        Content.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Footer = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Margin = new Padding(0, 12, 0, 0) };
        Root.Controls.Add(Content, 0, 0);
        Root.Controls.Add(Footer, 0, 1);
        Controls.Add(Root);
        ResumeLayout(false);
    }

    /// <summary>
    /// 添加右侧操作按钮 先添加的位于最右
    /// </summary>
    protected StudioButton AddAction(string Text, eButtonKind Kind, EventHandler Click)
    {
        var Button = new StudioButton { Text = Text, Kind = Kind, Margin = new Padding(8, 0, 0, 0) };
        Button.Click += Click;
        Footer.Controls.Add(Button);
        return Button;
    }

    protected static Label FieldLabel(string Text) => new() { Text = Text, AutoSize = true, Margin = new Padding(0, 9, 12, 0), Tag = eThemeRole.Muted };

    /// <summary>
    /// 显示前套用主题并同步标题栏
    /// </summary>
    public DialogResult ShowThemed(IWin32Window? Owner, AppTheme Theme)
    {
        Theme.Apply(this);
        HandleCreated += (_, _) => Theme.ApplyTitleBar(this);
        return Owner is null ? ShowDialog() : ShowDialog(Owner);
    }
}

public static class StudioPrompt
{
    /// <summary>
    /// 输入一段文字 取消返回 null 未允许空白时空白也返回 null
    /// </summary>
    public static string? Text(IWin32Window? Owner, AppTheme Theme, string Title, string Label, string Initial, bool Multiline = false, bool AllowEmpty = false)
    {
        using var Dialog = new PromptDialog(Title, Label, Initial, Multiline, null);
        if (Dialog.ShowThemed(Owner, Theme) != DialogResult.OK) return null;
        string Value = Dialog.Value.Trim();
        return Value.Length != 0 || AllowEmpty ? Value : null;
    }

    /// <summary>
    /// 要求人工勾选核实声明并填写证据 返回证据文本 未确认返回 null
    /// </summary>
    public static string? Evidence(IWin32Window? Owner, AppTheme Theme, string Title, string Message, string Statement)
    {
        using var Dialog = new PromptDialog(Title, Message, "", true, Statement);
        return Dialog.ShowThemed(Owner, Theme) == DialogResult.OK && !string.IsNullOrWhiteSpace(Dialog.Value) ? Dialog.Value.Trim() : null;
    }

    /// <summary>
    /// 只读查看长文本
    /// </summary>
    public static void View(IWin32Window? Owner, AppTheme Theme, string Title, string Caption, string Body)
    {
        using var Dialog = new ViewerDialog(Title, Caption, Body);
        Dialog.ShowThemed(Owner, Theme);
    }

    private sealed class PromptDialog : StudioDialog
    {
        /// <summary> 输入框 </summary>
        private readonly TextBox Input;
        public string Value => Input.Text;

        public PromptDialog(string Title, string Label, string Initial, bool Multiline, string? Statement)
            : base(Title, new Size(600, Multiline ? 360 : 220))
        {
            Content.RowCount = Statement is null ? 2 : 3;
            Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Content.RowStyles.Add(new RowStyle(Multiline ? SizeType.Percent : SizeType.AutoSize, 100));
            Content.Controls.Add(new StudioWrapLabel { Text = Label, Margin = new Padding(0, 0, 0, 10) });
            Input = new TextBox { Text = Initial, Dock = DockStyle.Fill, Multiline = Multiline, ScrollBars = Multiline ? ScrollBars.Vertical : ScrollBars.None, MaxLength = 4000 };
            Content.Controls.Add(Input);
            var Confirm = AddAction("确定", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.OK);
            AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
            if (Statement is not null)
            {
                Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
                var Check = new CheckBox { Text = Statement, AutoSize = true, Margin = new Padding(0, 10, 0, 0) };
                Content.Controls.Add(Check);
                Confirm.Enabled = false;
                void UpdateConfirm() => Confirm.Enabled = Check.Checked && Input.Text.Trim().Length != 0;
                Check.CheckedChanged += (_, _) => UpdateConfirm();
                Input.TextChanged += (_, _) => UpdateConfirm();
            }
            AcceptButton = Multiline ? null : Confirm;
        }
    }

    private sealed class ViewerDialog : StudioDialog
    {
        public ViewerDialog(string Title, string Caption, string Body) : base(Title, new Size(860, 620))
        {
            MaximizeBox = true;
            Content.RowCount = 2;
            Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Content.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            Content.Controls.Add(new Label { Text = Caption, AutoSize = false, Dock = DockStyle.Fill, Height = 26, AutoEllipsis = true, Tag = eThemeRole.Muted, Font = StudioFonts.Caption });
            Content.Controls.Add(new TextBox { Text = Body.ReplaceLineEndings("\r\n"), Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Both, WordWrap = false, Font = StudioFonts.Mono });
            AddAction("关闭", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.Cancel);
        }
    }
}
