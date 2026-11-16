using System.Drawing.Drawing2D;

namespace CodexInstanceManager;

public static class AgentAvatars
{
    /// <summary> 256 像素内置头像缓存 生命周期与进程一致 </summary>
    private static readonly Dictionary<string, Lazy<Bitmap>> AvatarDict = new[] { "codex", "claude", "deepseek", "gemini", "grok" }
        .ToDictionary(Name => Name, Name => new Lazy<Bitmap>(() => Load(Name)));

    public static Bitmap Draw(string Provider, string Number, int Size, Color BadgeColor)
    {
        string Name = Provider switch { "dsh" => "deepseek", "antigravity" => "gemini", "cursor" => "grok", _ => Provider };
        return Draw(AvatarDict[Name].Value, Number, Size, BadgeColor);
    }

    public static Bitmap Draw(Image Source, string Number, int Size, Color BadgeColor)
    {
        var Result = new Bitmap(Size, Size);
        using var Canvas = Graphics.FromImage(Result);
        Canvas.SmoothingMode = SmoothingMode.AntiAlias;
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        float Ratio = Math.Min((float)Size / Source.Width, (float)Size / Source.Height);
        float Width = Source.Width * Ratio;
        float Height = Source.Height * Ratio;
        Canvas.DrawImage(Source, (Size - Width) / 2, (Size - Height) / 2, Width, Height);
        bool Small = Size <= 32;
        float Diameter = Size * (Small ? .52f : .40f);
        var Bounds = new RectangleF(Size - Diameter - 1, Size - Diameter - 1, Diameter, Diameter);
        var FillColor = Small ? Color.FromArgb(BadgeColor.R * 2 / 5, BadgeColor.G * 2 / 5, BadgeColor.B * 2 / 5) : BadgeColor;
        using var Fill = new SolidBrush(FillColor);
        using var Border = new Pen(Color.White, Math.Max(1, Size / 40f));
        Canvas.FillEllipse(Fill, Bounds);
        Canvas.DrawEllipse(Border, Bounds);
        if (Small) Canvas.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
        float FontRatio = Number.Length > 1 ? .55f : Small ? .78f : .69f;
        using var Font = new Font("Segoe UI", Diameter * FontRatio, FontStyle.Bold, GraphicsUnit.Pixel);
        using var TextBrush = new SolidBrush(Color.White);
        using var Format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        Canvas.DrawString(Number, Font, TextBrush, Bounds, Format);
        return Result;
    }

    private static Bitmap Load(string Name)
    {
        using var Stream = typeof(AgentAvatars).Assembly.GetManifestResourceStream("MmAgentWork.Avatar." + Name)
            ?? throw new InvalidDataException("缺少 Agent 头像 " + Name);
        using var Source = Image.FromStream(Stream);
        var Result = new Bitmap(256, 256);
        using var Canvas = Graphics.FromImage(Result);
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        Canvas.DrawImage(Source, new Rectangle(0, 0, 256, 256));
        return Result;
    }
}
