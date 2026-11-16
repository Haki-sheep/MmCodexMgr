using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace CodexInstanceManager;

public sealed class BrandingService : IDisposable
{
    private readonly Dictionary<IntPtr, WindowBranding> WindowDict = new();
    private readonly Dictionary<string, Icon> IconDict = new();
    private static readonly PropertyKey AppIdKey = new(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
    private static readonly PropertyKey IconResourceKey = new(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 3);
    private static readonly PropertyKey RelaunchKey = new(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 2);
    private static readonly PropertyKey DisplayNameKey = new(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 4);
    private sealed record WindowBranding(IntPtr SmallIcon, IntPtr LargeIcon, int ProcessId, long StartedAt, string Signature);

    #region Icons
    public static string GetIconPath(InstanceProfile Profile, string Provider = "codex")
    {
        if (!string.IsNullOrWhiteSpace(Profile.IconPath))
        {
            if (!File.Exists(Profile.IconPath)) throw new FileNotFoundException("自定义图标不存在", Profile.IconPath);
            return Profile.IconPath;
        }
        string DirectoryPath = Path.Combine(ManagerPaths.Root, "icons");
        Directory.CreateDirectory(DirectoryPath);
        string Signature = "avatar-v2" + Provider + Profile.Id + Profile.Badge + Profile.ColorHex;
        string Hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Signature)))[..20];
        string IconPath = Path.Combine(DirectoryPath, Provider + "-" + Hash + ".ico");
        if (File.Exists(IconPath)) return IconPath;
        var BadgeColor = ColorTranslator.FromHtml(Profile.ColorHex);
        SaveIcon(Size => AgentAvatars.Draw(Provider, Profile.Badge, Size, BadgeColor), IconPath);
        return IconPath;
    }

    public static void SaveIcon(Bitmap Bitmap, string IconPath)
    {
        using var FileStream = File.Create(IconPath);
        WriteIcon(Bitmap, FileStream);
    }

    internal static void SaveIcon(Func<int, Bitmap> Draw, string IconPath)
    {
        using var FileStream = File.Create(IconPath);
        WriteIcon(Draw, FileStream);
    }

    internal static void WriteIcon(Bitmap Bitmap, Stream Output) => WriteIcon(Size =>
    {
        var Scaled = new Bitmap(Size, Size);
        using var Canvas = Graphics.FromImage(Scaled);
        Canvas.InterpolationMode = InterpolationMode.HighQualityBicubic;
        Canvas.DrawImage(Bitmap, new Rectangle(0, 0, Size, Size));
        return Scaled;
    }, Output);

    private static void WriteIcon(Func<int, Bitmap> Draw, Stream Output)
    {
        int[] SizeList = { 16, 24, 32, 48, 64, 128, 256 };
        var ImageList = new List<byte[]>();
        foreach (int Size in SizeList)
        {
            using var Scaled = Draw(Size);
            using var Stream = new MemoryStream();
            Scaled.Save(Stream, System.Drawing.Imaging.ImageFormat.Png);
            ImageList.Add(Stream.ToArray());
        }
        using var Writer = new BinaryWriter(Output, Encoding.UTF8, leaveOpen: true);
        Writer.Write((ushort)0); Writer.Write((ushort)1); Writer.Write((ushort)SizeList.Length);
        int Offset = 6 + SizeList.Length * 16;
        for (int Index = 0; Index < SizeList.Length; Index++)
        {
            Writer.Write((byte)(SizeList[Index] == 256 ? 0 : SizeList[Index]));
            Writer.Write((byte)(SizeList[Index] == 256 ? 0 : SizeList[Index]));
            Writer.Write((byte)0); Writer.Write((byte)0); Writer.Write((ushort)1); Writer.Write((ushort)32);
            Writer.Write(ImageList[Index].Length); Writer.Write(Offset);
            Offset += ImageList[Index].Length;
        }
        foreach (var Image in ImageList) Writer.Write(Image);
    }

    public static Bitmap DrawBadge(InstanceProfile Profile, int Size)
    {
        return AgentAvatars.Draw("codex", Profile.Badge, Size, ColorTranslator.FromHtml(Profile.ColorHex));
    }
    #endregion

    #region Window branding
    public void Apply(InstanceProfile Profile, IntPtr Window, string Provider = "codex", int ExpectedProcessId = 0, long? ExpectedStartedAt = null)
    {
        if (Window == IntPtr.Zero || !IsWindow(Window)) return;
        GetWindowThreadProcessId(Window, out uint ProcessId);
        if (ExpectedProcessId != 0 && ProcessId != ExpectedProcessId) return;
        using var Process = System.Diagnostics.Process.GetProcessById((int)ProcessId);
        long StartedAt = Process.StartTime.ToUniversalTime().Ticks;
        if (ExpectedStartedAt is not null && StartedAt != ExpectedStartedAt) return;
        string Signature = Provider + Profile.Id + Profile.ColorHex + Profile.Badge + Profile.IconPath + (File.Exists(Profile.IconPath) ? File.GetLastWriteTimeUtc(Profile.IconPath).Ticks : 0);
        if (!IconDict.TryGetValue(Signature, out Icon? InstanceIcon))
        {
            InstanceIcon = new Icon(GetIconPath(Profile, Provider), new Size(64, 64));
            IconDict.Add(Signature, InstanceIcon);
        }
        if (!WindowDict.TryGetValue(Window, out var Previous) || Previous.ProcessId != ProcessId || Previous.StartedAt != StartedAt)
        {
            ClearLegacyShellProperties(Window);
            WindowDict[Window] = new WindowBranding(ReadIcon(Window, 0), ReadIcon(Window, 1), (int)ProcessId, StartedAt, Signature);
        }
        else if (Previous.Signature != Signature || ReadIcon(Window, 0) != InstanceIcon.Handle || ReadIcon(Window, 1) != InstanceIcon.Handle)
        {
            WindowDict[Window] = Previous with { Signature = Signature };
        }
        if (ReadIcon(Window, 0) != InstanceIcon.Handle) SendIcon(Window, 0, InstanceIcon.Handle);
        if (ReadIcon(Window, 1) != InstanceIcon.Handle) SendIcon(Window, 1, InstanceIcon.Handle);
    }

    private static void ClearLegacyShellProperties(IntPtr Window)
    {
        if (AgentIconShortcuts.IsManagedIcon(GetProperty(Window, IconResourceKey))) SetProperty(Window, IconResourceKey, null);
        if (GetProperty(Window, AppIdKey)?.StartsWith("CodexInstanceManager.", StringComparison.Ordinal) == true)
        {
            SetProperty(Window, RelaunchKey, null);
            SetProperty(Window, DisplayNameKey, null);
            SetProperty(Window, AppIdKey, null);
        }
    }

    public void RestoreNative(IEnumerable<IntPtr> WindowList)
    {
        foreach (IntPtr Window in WindowList.Concat(WindowDict.Keys).Where(Window => Window != IntPtr.Zero).Distinct())
        {
            if (!IsWindow(Window)) continue;
            if (WindowDict.TryGetValue(Window, out var Original) && IsSameWindow(Window, Original))
            {
                RestoreWindow(Window, Original);
                continue;
            }
            ClearLegacyShellProperties(Window);
        }
        WindowDict.Clear();
        foreach (var Icon in IconDict.Values) Icon.Dispose();
        IconDict.Clear();
    }

    public void Dispose()
    {
        foreach (var Item in WindowDict)
        {
            if (IsSameWindow(Item.Key, Item.Value)) RestoreWindow(Item.Key, Item.Value);
        }
        WindowDict.Clear();
        foreach (var InstanceIcon in IconDict.Values) InstanceIcon.Dispose();
        IconDict.Clear();
    }

    private static bool IsSameWindow(IntPtr Window, WindowBranding Original)
    {
        if (!IsWindow(Window)) return false;
        GetWindowThreadProcessId(Window, out uint ProcessId);
        if (ProcessId != Original.ProcessId) return false;
        try
        {
            using var Process = System.Diagnostics.Process.GetProcessById(Original.ProcessId);
            return Process.StartTime.ToUniversalTime().Ticks == Original.StartedAt;
        }
        catch (ArgumentException) { return false; }
    }

    private static void RestoreWindow(IntPtr Window, WindowBranding Original)
    {
        SendIcon(Window, 0, Original.SmallIcon);
        SendIcon(Window, 1, Original.LargeIcon);
        ClearLegacyShellProperties(Window);
    }

    private static IntPtr ReadIcon(IntPtr Window, int Kind)
    {
        SendMessageTimeout(Window, 0x007F, new IntPtr(Kind), IntPtr.Zero, 2, 250, out IntPtr Result);
        return Result;
    }
    private static void SendIcon(IntPtr Window, int Kind, IntPtr Value) => SendMessageTimeout(Window, 0x0080, new IntPtr(Kind), Value, 2, 250, out _);
    private static string? GetProperty(IntPtr Window, PropertyKey Key)
    {
        Guid InterfaceId = typeof(IPropertyStore).GUID;
        Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(Window, ref InterfaceId, out IPropertyStore Store));
        try
        {
            Store.GetValue(ref Key, out PropVariant Value);
            try { return Value.Type == 31 ? Marshal.PtrToStringUni(Value.Pointer) : null; }
            finally { PropVariantClear(ref Value); }
        }
        finally { Marshal.FinalReleaseComObject(Store); }
    }

    private static void SetProperty(IntPtr Window, PropertyKey Key, string? AppId)
    {
        Guid InterfaceId = typeof(IPropertyStore).GUID;
        Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(Window, ref InterfaceId, out IPropertyStore Store));
        var Value = new PropVariant { Type = AppId is null ? (ushort)0 : (ushort)31, Pointer = AppId is null ? IntPtr.Zero : Marshal.StringToCoTaskMemUni(AppId) };
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
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr Window, out uint ProcessId);
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr SendMessageTimeout(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam, uint Flags, uint Timeout, out IntPtr Result);
    #endregion
}
