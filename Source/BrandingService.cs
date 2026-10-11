using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;

namespace CodexInstanceManager;

public sealed class BrandingService : IDisposable
{
    private readonly Dictionary<IntPtr, WindowBranding> WindowDict = new();
    private readonly Dictionary<string, Icon> IconDict = new();
    private static readonly PropertyKey AppIdKey = new(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
    private sealed record WindowBranding(IntPtr SmallIcon, IntPtr LargeIcon, string? AppId);

    #region Icons
    public static string GetIconPath(InstanceProfile Profile)
    {
        if (!string.IsNullOrWhiteSpace(Profile.IconPath))
        {
            if (!File.Exists(Profile.IconPath)) throw new FileNotFoundException("自定义图标不存在", Profile.IconPath);
            return Profile.IconPath;
        }
        string DirectoryPath = Path.Combine(ManagerPaths.Root, "icons");
        Directory.CreateDirectory(DirectoryPath);
        string IconPath = Path.Combine(DirectoryPath, Profile.Id + ".ico");
        using var Bitmap = DrawBadge(Profile, 64);
        SaveIcon(Bitmap, IconPath);
        return IconPath;
    }

    public static void SaveIcon(Bitmap Bitmap, string IconPath)
    {
        using var ImageStream = new MemoryStream();
        Bitmap.Save(ImageStream, System.Drawing.Imaging.ImageFormat.Png);
        byte[] ImageList = ImageStream.ToArray();
        using var FileStream = File.Create(IconPath);
        using var Writer = new BinaryWriter(FileStream);
        Writer.Write((ushort)0); Writer.Write((ushort)1); Writer.Write((ushort)1);
        Writer.Write((byte)64); Writer.Write((byte)64); Writer.Write((byte)0); Writer.Write((byte)0);
        Writer.Write((ushort)1); Writer.Write((ushort)32); Writer.Write(ImageList.Length); Writer.Write(22); Writer.Write(ImageList);
    }

    public static Bitmap DrawBadge(InstanceProfile Profile, int Size)
    {
        var Bitmap = new Bitmap(Size, Size);
        using var Graphics = System.Drawing.Graphics.FromImage(Bitmap);
        Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        Graphics.Clear(Color.Transparent);
        using var Brush = new SolidBrush(ColorTranslator.FromHtml(Profile.ColorHex));
        Graphics.FillEllipse(Brush, 2, 2, Size - 4, Size - 4);
        using var TextBrush = new SolidBrush(Color.White);
        using var TextFont = new Font("Segoe UI", Size * 0.40f, FontStyle.Bold, GraphicsUnit.Pixel);
        using var Format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        Graphics.DrawString(Profile.Badge, TextFont, TextBrush, new RectangleF(0, 0, Size, Size - 1), Format);
        return Bitmap;
    }
    #endregion

    #region Window branding
    public void Apply(InstanceProfile Profile, IntPtr Window)
    {
        if (Window == IntPtr.Zero || !IsWindow(Window)) return;
        string Signature = Profile.Id + Profile.ColorHex + Profile.Badge + Profile.IconPath + (File.Exists(Profile.IconPath) ? File.GetLastWriteTimeUtc(Profile.IconPath).Ticks : 0);
        if (!IconDict.TryGetValue(Signature, out Icon? InstanceIcon))
        {
            InstanceIcon = new Icon(GetIconPath(Profile), new Size(64, 64));
            IconDict.Add(Signature, InstanceIcon);
        }
        if (!WindowDict.ContainsKey(Window))
        {
            WindowDict.Add(Window, new WindowBranding(ReadIcon(Window, 0), ReadIcon(Window, 1), GetAppId(Window)));
            SetAppId(Window, "CodexInstanceManager." + Profile.Id);
        }
        SendIcon(Window, 0, InstanceIcon.Handle);
        SendIcon(Window, 1, InstanceIcon.Handle);
    }

    public void Dispose()
    {
        foreach (var Item in WindowDict)
        {
            if (!IsWindow(Item.Key)) continue;
            SendIcon(Item.Key, 0, Item.Value.SmallIcon);
            SendIcon(Item.Key, 1, Item.Value.LargeIcon);
            SetAppId(Item.Key, Item.Value.AppId);
        }
        WindowDict.Clear();
        foreach (var InstanceIcon in IconDict.Values) InstanceIcon.Dispose();
        IconDict.Clear();
    }

    private static IntPtr ReadIcon(IntPtr Window, int Kind)
    {
        SendMessageTimeout(Window, 0x007F, new IntPtr(Kind), IntPtr.Zero, 2, 250, out IntPtr Result);
        return Result;
    }
    private static void SendIcon(IntPtr Window, int Kind, IntPtr Value) => SendMessageTimeout(Window, 0x0080, new IntPtr(Kind), Value, 2, 250, out _);
    private static string? GetAppId(IntPtr Window)
    {
        Guid InterfaceId = typeof(IPropertyStore).GUID;
        Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(Window, ref InterfaceId, out IPropertyStore Store));
        try
        {
            var Key = AppIdKey;
            Store.GetValue(ref Key, out PropVariant Value);
            try { return Value.Type == 31 ? Marshal.PtrToStringUni(Value.Pointer) : null; }
            finally { PropVariantClear(ref Value); }
        }
        finally { Marshal.FinalReleaseComObject(Store); }
    }

    private static void SetAppId(IntPtr Window, string? AppId)
    {
        Guid InterfaceId = typeof(IPropertyStore).GUID;
        Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(Window, ref InterfaceId, out IPropertyStore Store));
        var Value = new PropVariant { Type = AppId is null ? (ushort)0 : (ushort)31, Pointer = AppId is null ? IntPtr.Zero : Marshal.StringToCoTaskMemUni(AppId) };
        var Key = AppIdKey;
        try { Store.SetValue(ref Key, ref Value); Store.Commit(); }
        finally { PropVariantClear(ref Value); Marshal.FinalReleaseComObject(Store); }
    }

    [StructLayout(LayoutKind.Sequential)] private readonly struct PropertyKey
    {
        public readonly Guid FormatId;
        public readonly uint PropertyId;
        public PropertyKey(Guid FormatId, uint PropertyId) { this.FormatId = FormatId; this.PropertyId = PropertyId; }
    }
    [StructLayout(LayoutKind.Explicit)] private struct PropVariant
    {
        [FieldOffset(0)] public ushort Type;
        [FieldOffset(8)] public IntPtr Pointer;
        [FieldOffset(16)] private long Padding;
    }
    [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IPropertyStore
    {
        public void GetCount(out uint Count);
        public void GetAt(uint Index, out PropertyKey Key);
        public void GetValue([In] ref PropertyKey Key, out PropVariant Value);
        public void SetValue([In] ref PropertyKey Key, [In] ref PropVariant Value);
        public void Commit();
    }
    [DllImport("shell32.dll")] private static extern int SHGetPropertyStoreForWindow(IntPtr Window, ref Guid InterfaceId, out IPropertyStore Store);
    [DllImport("ole32.dll")] private static extern int PropVariantClear(ref PropVariant Value);
    [DllImport("user32.dll")] private static extern bool IsWindow(IntPtr Window);
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr SendMessageTimeout(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam, uint Flags, uint Timeout, out IntPtr Result);
    #endregion
}
