namespace CodexInstanceManager;

public sealed class ThemeComboBox : ComboBox
{
    public AppTheme Theme { get; set; } = new(false);

    public ThemeComboBox()
    {
        DrawMode = DrawMode.OwnerDrawFixed;
        FlatStyle = FlatStyle.Flat;
    }

    protected override void OnFontChanged(EventArgs Event)
    {
        base.OnFontChanged(Event);
        ItemHeight = Font.Height + LogicalToDeviceUnits(10);
    }

    protected override void OnDrawItem(DrawItemEventArgs Event)
    {
        var Colors = Theme.Palette;
        bool Selected = (Event.State & DrawItemState.Selected) != 0;
        using var Background = new SolidBrush(Selected ? Colors.Selection : Colors.Input);
        Event.Graphics.FillRectangle(Background, Event.Bounds);
        string? Value = Event.Index >= 0 ? GetItemText(Items[Event.Index]) : Text;
        var TextBounds = new Rectangle(Event.Bounds.Left + LogicalToDeviceUnits(6), Event.Bounds.Top, Math.Max(0, Event.Bounds.Width - LogicalToDeviceUnits(8)), Event.Bounds.Height);
        TextRenderer.DrawText(Event.Graphics, Value, Font, TextBounds, Enabled ? Colors.Text : Colors.Muted, TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
    }
}
