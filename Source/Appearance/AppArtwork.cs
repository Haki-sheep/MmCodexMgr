namespace CodexInstanceManager;

public static class AppArtwork
{
    /// <summary>
    /// 返回独立图标副本 由调用方释放
    /// </summary>
    public static Icon CreateIcon(int Size = 64)
    {
        using var Stream = typeof(AppArtwork).Assembly.GetManifestResourceStream("MmAgentWork.Icon")
            ?? throw new InvalidDataException("缺少 AIMoreMoreWork 图标资源");
        using var Source = new Icon(Stream, Size, Size);
        return (Icon)Source.Clone();
    }

    /// <summary>
    /// 返回独立背景位图 由调用方释放
    /// </summary>
    public static Bitmap CreateBackground()
    {
        using var Stream = typeof(AppArtwork).Assembly.GetManifestResourceStream("MmAgentWork.Background")
            ?? throw new InvalidDataException("缺少 AIMoreMoreWork 背景资源");
        using var Source = Image.FromStream(Stream);
        return new Bitmap(Source);
    }
}
