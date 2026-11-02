using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

public static class StudioGeometry
{
    public static GraphicsPath Rounded(RectangleF Bounds, float Radius)
    {
        float Diameter = Radius * 2;
        var Path = new GraphicsPath();
        Path.AddArc(Bounds.Left, Bounds.Top, Diameter, Diameter, 180, 90);
        Path.AddArc(Bounds.Right - Diameter, Bounds.Top, Diameter, Diameter, 270, 90);
        Path.AddArc(Bounds.Right - Diameter, Bounds.Bottom - Diameter, Diameter, Diameter, 0, 90);
        Path.AddArc(Bounds.Left, Bounds.Bottom - Diameter, Diameter, Diameter, 90, 90);
        Path.CloseFigure();
        return Path;
    }
}

public sealed class StudioButton : Button
{
    /// <summary> 指针悬停状态 </summary>
    private bool Hovering;
    public StudioButton() => DoubleBuffered = true;
    protected override void OnMouseEnter(EventArgs Event) { Hovering = true; Invalidate(); base.OnMouseEnter(Event); }
    protected override void OnMouseLeave(EventArgs Event) { Hovering = false; Invalidate(); base.OnMouseLeave(Event); }
    protected override void OnPaint(PaintEventArgs Event)
    {
        Event.Graphics.Clear(Parent?.BackColor ?? BackColor);
        Event.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DeviceDpi / 96f;
        using var Path = StudioGeometry.Rounded(new RectangleF(.5f, .5f, Width - 1, Height - 1), 7 * Scale);
        using var Brush = new SolidBrush(Hovering && Enabled ? ControlPaint.Light(BackColor, .12f) : BackColor);
        Event.Graphics.FillPath(Brush, Path);
        if (FlatAppearance.BorderSize > 0)
        {
            using var Pen = new Pen(FlatAppearance.BorderColor);
            Event.Graphics.DrawPath(Pen, Path);
        }
        TextRenderer.DrawText(Event.Graphics, Text, Font, ClientRectangle, Enabled ? ForeColor : SystemColors.GrayText, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine);
        if (Focused && ShowFocusCues) ControlPaint.DrawFocusRectangle(Event.Graphics, Rectangle.Inflate(ClientRectangle, -5, -5));
    }
}

public sealed class StudioCard : Panel
{
    public StudioCard() => DoubleBuffered = true;
    protected override void OnPaintBackground(PaintEventArgs Event)
    {
        Event.Graphics.Clear(Parent?.BackColor ?? BackColor);
        Event.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        using var Path = StudioGeometry.Rounded(new RectangleF(0, 0, Width - 1, Height - 1), 12 * DeviceDpi / 96f);
        using var Brush = new SolidBrush(BackColor);
        Event.Graphics.FillPath(Brush, Path);
    }
}
