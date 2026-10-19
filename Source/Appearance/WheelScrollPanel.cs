namespace CodexInstanceManager;

public sealed class WheelScrollPanel : Panel, IMessageFilter
{
    private const int MouseWheelMessage = 0x020A;

    protected override void OnHandleCreated(EventArgs Event)
    {
        base.OnHandleCreated(Event);
        Application.AddMessageFilter(this);
    }

    protected override void OnHandleDestroyed(EventArgs Event)
    {
        Application.RemoveMessageFilter(this);
        base.OnHandleDestroyed(Event);
    }

    public bool PreFilterMessage(ref Message Message)
    {
        if (Message.Msg != MouseWheelMessage || !Visible || !Enabled || !VerticalScroll.Visible) return false;
        var Source = Control.FromChildHandle(Message.HWnd);
        if (Source is null || Source.FindForm() != FindForm()) return false;
        long Position = Message.LParam.ToInt64();
        var ScreenPoint = new Point((short)Position, (short)(Position >> 16));
        if (!RectangleToScreen(new Rectangle(Point.Empty, Size)).Contains(ScreenPoint)) return false;
        Control Target = this;
        while (Target.GetChildAtPoint(Target.PointToClient(ScreenPoint), GetChildAtPointSkip.Invisible) is Control Child)
        {
            Target = Child;
            if (Target is ComboBox or UpDownBase or ListBox or DataGridView || Target is TextBoxBase { Multiline: true }) return false;
            if (Target is ScrollableControl { AutoScroll: true, VerticalScroll.Visible: true }) return false;
        }
        int Delta = (short)(Message.WParam.ToInt64() >> 16);
        var ClientPoint = PointToClient(ScreenPoint);
        OnMouseWheel(new HandledMouseEventArgs(MouseButtons.None, 0, ClientPoint.X, ClientPoint.Y, Delta));
        return true;
    }
}
