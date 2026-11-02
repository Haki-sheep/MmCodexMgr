using System.Collections.ObjectModel;
using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

public sealed class NavigationPage : Panel
{
    public NavigationPage(string Title) { Text = Title; Tag = eThemeRole.Background; }
}

public sealed class ThemeTabControl : UserControl
{
    public Collection<NavigationPage> TabPages { get; }
    /// <summary> 当前页面 </summary>
    private NavigationPage? Current;
    public AppTheme Theme { get; set; } = new(false);
    public bool ShowBrand { get; set; } = true;
    public event EventHandler? SelectedIndexChanged;
    public NavigationPage? SelectedTab
    {
        get => Current;
        set
        {
            if (value == Current) return;
            if (value is null || !TabPages.Contains(value)) throw new ArgumentException("页面未注册");
            if (Current is not null) Current.Visible = false;
            Current = value;
            Current.Visible = true;
            Current.BringToFront();
            SelectedIndexChanged?.Invoke(this, EventArgs.Empty);
            Invalidate();
        }
    }

    public ThemeTabControl()
    {
        DoubleBuffered = true;
        TabPages = new PageCollection(this);
    }

    protected override void OnLayout(LayoutEventArgs Event)
    {
        base.OnLayout(Event);
        if (TabPages is null) return;
        int HeaderHeight = (int)(62 * DeviceDpi / 96f);
        foreach (var Page in TabPages) Page.Bounds = new Rectangle(0, HeaderHeight, ClientSize.Width, Math.Max(0, ClientSize.Height - HeaderHeight));
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        Event.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        float Scale = DeviceDpi / 96f;
        var Colors = Theme.Palette;
        using var BrandFont = new Font(Font.FontFamily, 15, FontStyle.Bold);
        if (ShowBrand) TextRenderer.DrawText(Event.Graphics, "M", BrandFont, new Rectangle((int)(22 * Scale), (int)(16 * Scale), (int)(32 * Scale), (int)(32 * Scale)), Colors.Accent, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        for (int Index = 0; Index < TabPages.Count; Index++)
        {
            var Bounds = TabBounds(Index);
            bool Selected = TabPages[Index] == Current;
            if (Selected)
            {
                using var Path = StudioGeometry.Rounded(Bounds, 8 * Scale);
                using var Brush = new SolidBrush(Colors.Selection);
                Event.Graphics.FillPath(Brush, Path);
            }
            TextRenderer.DrawText(Event.Graphics, TabPages[Index].Text, Font, Bounds, Selected ? Colors.Accent : Colors.Muted, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }
        using var Pen = new Pen(Colors.Border);
        Event.Graphics.DrawLine(Pen, 22 * Scale, 61 * Scale, Width - 22 * Scale, 61 * Scale);
    }

    private Rectangle TabBounds(int Index)
    {
        float Scale = DeviceDpi / 96f;
        return new Rectangle((int)(((ShowBrand ? 72 : 0) + Index * 156) * Scale), (int)(12 * Scale), (int)(148 * Scale), (int)(38 * Scale));
    }
    protected override void OnMouseDown(MouseEventArgs Event)
    {
        base.OnMouseDown(Event);
        for (int Index = 0; Index < TabPages.Count; Index++) if (TabBounds(Index).Contains(Event.Location)) SelectedTab = TabPages[Index];
    }
    protected override bool ProcessCmdKey(ref Message Message, Keys KeyData)
    {
        if (KeyData == (Keys.Control | Keys.Tab) || KeyData == (Keys.Control | Keys.Shift | Keys.Tab))
        {
            int Offset = KeyData.HasFlag(Keys.Shift) ? -1 : 1;
            SelectedTab = TabPages[(TabPages.IndexOf(Current!) + Offset + TabPages.Count) % TabPages.Count];
            return true;
        }
        return base.ProcessCmdKey(ref Message, KeyData);
    }

    private sealed class PageCollection : Collection<NavigationPage>
    {
        /// <summary> 所属导航视图 </summary>
        private readonly ThemeTabControl Owner;
        public PageCollection(ThemeTabControl Owner) => this.Owner = Owner;
        protected override void InsertItem(int Index, NavigationPage Item)
        {
            base.InsertItem(Index, Item);
            Item.Visible = false;
            Owner.Controls.Add(Item);
            if (Owner.Current is null) Owner.SelectedTab = Item;
            Owner.PerformLayout();
        }
    }
}
