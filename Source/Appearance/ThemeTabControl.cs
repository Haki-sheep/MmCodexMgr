namespace CodexInstanceManager;

public sealed class ThemeTabControl : TabControl
{
    private const int PaintMessage = 0x000F;
    private const int PrintMessage = 0x0317;
    private const int PrintClientMessage = 0x0318;
    public AppTheme Theme { get; set; } = new(false);

    public ThemeTabControl() => DrawMode = TabDrawMode.OwnerDrawFixed;

    protected override void OnDrawItem(DrawItemEventArgs Event)
    {
        var Colors = Theme.Palette;
        using var Brush = new SolidBrush(Event.Index == SelectedIndex ? Colors.Surface : Colors.Background);
        Event.Graphics.FillRectangle(Brush, Event.Bounds);
        TextRenderer.DrawText(Event.Graphics, TabPages[Event.Index].Text, Font, Event.Bounds, Colors.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
    }

    protected override void WndProc(ref Message Message)
    {
        base.WndProc(ref Message);
        if (Message.Msg is not (PaintMessage or PrintMessage or PrintClientMessage) || TabCount == 0) return;
        var LastTab = GetTabRect(TabCount - 1);
        using var Canvas = Message.Msg == PaintMessage ? Graphics.FromHwnd(Handle) : Graphics.FromHdc(Message.WParam);
        using var Brush = new SolidBrush(Theme.Palette.Background);
        Canvas.FillRectangle(Brush, new Rectangle(LastTab.Right + 1, 0, Math.Max(0, ClientSize.Width - LastTab.Right - 1), LastTab.Bottom + 1));
    }
}
