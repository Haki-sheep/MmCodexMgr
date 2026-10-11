namespace CodexInstanceManager;

internal sealed class ConversationImportLease : IDisposable
{
    private readonly List<FileStream> FileList = new();

    public ConversationImportLease(string Home)
    {
        try
        {
            foreach (string Relative in new[] { ".sqlite-maintenance.lock", "thread-writer-locks/.coordination.lock" })
            {
                string PathValue = ImportPaths.Resolve(Home, Relative);
                Directory.CreateDirectory(Path.GetDirectoryName(PathValue)!);
                var Stream = new FileStream(PathValue, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite);
                FileList.Add(Stream);
                Stream.Lock(0, 1);
            }
        }
        catch (IOException Error) { Dispose(); throw new IOException("目标实例仍在使用会话数据 请完全退出后重试", Error); }
        catch { Dispose(); throw; }
    }

    public void Dispose()
    {
        foreach (var Stream in FileList) Stream.Dispose();
        FileList.Clear();
    }
}
