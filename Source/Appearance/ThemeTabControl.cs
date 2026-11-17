using System.Collections.ObjectModel;
using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

public sealed class NavigationPage : Panel
{
    public NavigationPage(string Title, string Glyph = "")
    {
        DoubleBuffered = true;
        Text = Title;
        this.Glyph = Glyph;
        Tag = eThemeRole.Background;
    }

    protected override void OnPaintBackground(PaintEventArgs Event)
    {
        if (Parent is ThemeTabControl Navigation) Navigation.PaintPageBackground(Event.Graphics, Bounds, Event.ClipRectangle);
        else base.OnPaintBackground(Event);
    }

    internal void SetPageVisible(bool Value)
    {
        var ContainerList = new List<Control>();
        CollectContainers(this, ContainerList);
        foreach (var Container in ContainerList) Container.SuspendLayout();
        try { Visible = Value; }
        finally
        {
            for (int Index = ContainerList.Count - 1; Index >= 0; Index--) ContainerList[Index].ResumeLayout(true);
        }
    }

    private static void CollectContainers(Control Root, List<Control> ContainerList)
    {
        if (!Root.HasChildren) return;
        ContainerList.Add(Root);
        foreach (Control Child in Root.Controls) CollectContainers(Child, ContainerList);
    }

    /// <summary> Segoe MDL2 Assets 图标字符 </summary>
    public string Glyph { get; }

}

/// <summary>
/// 左侧 208 逻辑像素侧栏导航 右侧承载当前页面
/// </summary>
public sealed class ThemeTabControl : UserControl, IThemedControl
{
    public const int SidebarLogicalWidth = 208;
    public Collection<NavigationPage> TabPages { get; }
    /// <summary> 当前页面 </summary>
    private NavigationPage? Current;
    /// <summary> 悬停中的导航项序号 </summary>
    private int HoverIndex = -1;
    /// <summary> 侧栏品牌图 由本控件释放 </summary>
    private readonly Bitmap BrandImage;
    /// <summary> 应用全局背景 由导航壳释放 </summary>
    private readonly Bitmap BackgroundArtwork = AppArtwork.CreateBackground();
    /// <summary> 按窗口尺寸和主题缓存的全局背景 </summary>
    private Bitmap? BackgroundCache;
    /// <summary> 侧栏底部日夜切换 </summary>
    private readonly StudioButton ThemeToggle = new() { Name = AppTheme.ToggleButtonName, AutoSize = false };
    public AppTheme Theme { get; set; } = new(false);
    public bool ShowBrand { get; set; } = true;
    public string BrandTitle { get; set; } = "AIMoreMoreWork";
    public string BrandCaption { get; set; } = "多 Agent 工作台";
    public event EventHandler? SelectedIndexChanged;
    public event EventHandler? ThemeToggleRequested;
    public NavigationPage? SelectedTab
    {
        get => Current;
        set
        {
            if (value == Current) return;
            if (value is null || !TabPages.Contains(value)) throw new ArgumentException("页面未注册");
            var Previous = Current;
            Current = value;
            SuspendLayout();
            try
            {
                SelectedIndexChanged?.Invoke(this, EventArgs.Empty);
                Current.BringToFront();
                Current.SetPageVisible(true);
                if (Previous is not null) Previous.SetPageVisible(false);
            }
            catch
            {
                value.SetPageVisible(false);
                Current = Previous;
                if (Previous is not null) { Previous.BringToFront(); Previous.SetPageVisible(true); }
                throw;
            }
            finally
            {
                ResumeLayout(true);
                Current?.Invalidate(true);
            }
            Invalidate(new Rectangle(0, 0, SidebarWidth, Height));
        }
    }

    public ThemeTabControl()
    {
        DoubleBuffered = true;
        ResizeRedraw = true;
        TabPages = new PageCollection(this);
        using (var Icon = AppArtwork.CreateIcon(64)) BrandImage = Icon.ToBitmap();
        ThemeToggle.Click += (_, _) => ThemeToggleRequested?.Invoke(this, EventArgs.Empty);
        Controls.Add(ThemeToggle);
    }

    private float DpiScale => DeviceDpi / 96f;
    private int SidebarWidth => (int)(SidebarLogicalWidth * DpiScale);

    public void ApplyTheme(AppTheme Theme)
    {
        this.Theme = Theme;
        BackColor = Theme.Palette.Sidebar;
        ForeColor = Theme.Palette.Text;
        BackgroundCache?.Dispose();
        BackgroundCache = null;
        Invalidate(true);
    }

    protected override void OnPaintBackground(PaintEventArgs Event)
    {
        if (Width <= 0 || Height <= 0) return;
        EnsureBackground();
        Event.Graphics.DrawImage(BackgroundCache!, Event.ClipRectangle, Event.ClipRectangle, GraphicsUnit.Pixel);
    }

    internal void PaintPageBackground(Graphics Canvas, Rectangle PageBounds, Rectangle Clip)
    {
        if (Width <= 0 || Height <= 0) return;
        EnsureBackground();
        var Source = new Rectangle(PageBounds.X + Clip.X, PageBounds.Y + Clip.Y, Clip.Width, Clip.Height);
        Canvas.DrawImage(BackgroundCache!, Clip, Source, GraphicsUnit.Pixel);
    }

    private void EnsureBackground()
    {
        if (BackgroundCache is not null && BackgroundCache.Size == ClientSize) return;
        BackgroundCache?.Dispose();
        BackgroundCache = new Bitmap(Width, Height, System.Drawing.Imaging.PixelFormat.Format32bppPArgb);
        using var Canvas = Graphics.FromImage(BackgroundCache);
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        float Ratio = Math.Max((float)Width / BackgroundArtwork.Width, (float)Height / BackgroundArtwork.Height);
        float DrawWidth = BackgroundArtwork.Width * Ratio;
        float DrawHeight = BackgroundArtwork.Height * Ratio;
        Canvas.DrawImage(BackgroundArtwork, (Width - DrawWidth) / 2, (Height - DrawHeight) / 2, DrawWidth, DrawHeight);
        using var Veil = new SolidBrush(Color.FromArgb(Theme.IsDark ? 155 : 125, Theme.Palette.Background));
        Canvas.FillRectangle(Veil, ClientRectangle);
    }

    protected override void OnLayout(LayoutEventArgs Event)
    {
        base.OnLayout(Event);
        if (TabPages is null) return;
        foreach (var Page in TabPages) Page.Bounds = new Rectangle(SidebarWidth, 0, Math.Max(0, ClientSize.Width - SidebarWidth), ClientSize.Height);
        float Scale = DpiScale;
        int ToggleHeight = (int)(38 * Scale);
        ThemeToggle.Bounds = new Rectangle((int)(16 * Scale), ClientSize.Height - ToggleHeight - (int)(20 * Scale), SidebarWidth - (int)(32 * Scale), ToggleHeight);
    }

    protected override void OnPaint(PaintEventArgs Event)
    {
        base.OnPaint(Event);
        if (!Event.ClipRectangle.IntersectsWith(new Rectangle(0, 0, SidebarWidth, Height))) return;
        var Canvas = Event.Graphics;
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        var Colors = Theme.Palette;
        float Scale = DpiScale;
        using (var Sidebar = new SolidBrush(Color.FromArgb(215, Colors.Sidebar))) Canvas.FillRectangle(Sidebar, 0, 0, SidebarWidth, Height);
        using (var Line = new Pen(Colors.Border)) Canvas.DrawLine(Line, SidebarWidth - 1, 0, SidebarWidth - 1, Height);
        if (ShowBrand)
        {
            int IconSize = (int)(38 * Scale);
            var IconBounds = new Rectangle((int)(18 * Scale), (int)(22 * Scale), IconSize, IconSize);
            using (var Clip = StudioGeometry.Rounded(IconBounds, 10 * Scale))
            {
                var State = Canvas.Save();
                Canvas.SetClip(Clip, CombineMode.Intersect);
                Canvas.DrawImage(BrandImage, IconBounds);
                Canvas.Restore(State);
            }
            int TextLeft = IconBounds.Right + (int)(10 * Scale);
            TextRenderer.DrawText(Canvas, BrandTitle, StudioFonts.Strong, new Rectangle(TextLeft, (int)(22 * Scale), SidebarWidth - TextLeft - (int)(8 * Scale), (int)(20 * Scale)), Colors.Text, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
            TextRenderer.DrawText(Canvas, BrandCaption, StudioFonts.Small, new Rectangle(TextLeft, (int)(43 * Scale), SidebarWidth - TextLeft - (int)(8 * Scale), (int)(18 * Scale)), Colors.Muted, TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        }
        TextRenderer.DrawText(Canvas, "工作区", StudioFonts.Small, new Point((int)(24 * Scale), (int)(84 * Scale)), Colors.Subtle, TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        for (int Index = 0; Index < TabPages.Count; Index++)
        {
            var Bounds = TabBounds(Index);
            bool Selected = TabPages[Index] == Current;
            if (Selected || Index == HoverIndex)
            {
                using var Path = StudioGeometry.Rounded(Bounds, 10 * Scale);
                using var Brush = new SolidBrush(Selected ? Colors.AccentSoft : Colors.Inset);
                Canvas.FillPath(Brush, Path);
            }
            if (Selected)
            {
                using var Bar = StudioGeometry.Rounded(new RectangleF(Bounds.Left, Bounds.Top + 9 * Scale, 3 * Scale, Bounds.Height - 18 * Scale), 1.5f * Scale);
                using var Brush = new SolidBrush(Colors.Accent);
                Canvas.FillPath(Brush, Bar);
            }
            var Fore = Selected ? Colors.Accent : Colors.Text;
            if (TabPages[Index].Glyph.Length != 0)
                TextRenderer.DrawText(Canvas, TabPages[Index].Glyph, StudioFonts.Glyph, new Rectangle(Bounds.Left + (int)(14 * Scale), Bounds.Top, (int)(24 * Scale), Bounds.Height), Selected ? Colors.Accent : Colors.Muted, TextFormatFlags.VerticalCenter | TextFormatFlags.HorizontalCenter | TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
            var TextBounds = new Rectangle(Bounds.Left + (int)(46 * Scale), Bounds.Top, Bounds.Width - (int)(52 * Scale), Bounds.Height);
            TextRenderer.DrawText(Canvas, TabPages[Index].Text, Selected ? StudioFonts.Strong : StudioFonts.Body, TextBounds, Fore, TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding | TextFormatFlags.SingleLine | TextFormatFlags.PreserveGraphicsClipping | TextFormatFlags.PreserveGraphicsTranslateTransform);
        }
    }

    private Rectangle TabBounds(int Index)
    {
        float Scale = DpiScale;
        return new Rectangle((int)(12 * Scale), (int)((104 + Index * 46) * Scale), SidebarWidth - (int)(24 * Scale), (int)(40 * Scale));
    }

    protected override void OnMouseMove(MouseEventArgs Event)
    {
        base.OnMouseMove(Event);
        int Index = -1;
        for (int Item = 0; Item < TabPages.Count; Item++) if (TabBounds(Item).Contains(Event.Location)) Index = Item;
        Cursor = Index >= 0 ? Cursors.Hand : Cursors.Default;
        if (Index == HoverIndex) return;
        HoverIndex = Index;
        Invalidate(new Rectangle(0, 0, SidebarWidth, Height));
    }

    protected override void OnMouseLeave(EventArgs Event)
    {
        base.OnMouseLeave(Event);
        HoverIndex = -1;
        Invalidate(new Rectangle(0, 0, SidebarWidth, Height));
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

    protected override void Dispose(bool Disposing)
    {
        if (Disposing)
        {
            BrandImage.Dispose();
            BackgroundArtwork.Dispose();
            BackgroundCache?.Dispose();
        }
        base.Dispose(Disposing);
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
