using System.Security.Cryptography;
using CodexInstanceManager;

internal static class MemoryTests
{
    private const int FileSize = 64 * 1024 * 1024;
    private const long AllocationBudget = 8 * 1024 * 1024;

    public static int Run()
    {
        string Root = Path.Combine(Path.GetTempPath(), "CodexManagerMemory-" + Guid.NewGuid().ToString("N"));
        string SourceRoot = Path.Combine(Root, "source");
        string TargetRoot = Path.Combine(Root, "target");
        string Source = Path.Combine(SourceRoot, "skills", "large.bin");
        string Target = Path.Combine(TargetRoot, "skills", "large.bin");
        try
        {
            string SourceHash = WriteFixture(Source, 0x51);
            string TargetHash = WriteFixture(Target, 0xA7);
            File.SetAttributes(Source, FileAttributes.ReadOnly);
            SettingsStore.FileHash(Source);
            long BeforeHash = GC.GetTotalAllocatedBytes(true);
            Require(SettingsStore.FileHash(Source) == SourceHash, "large-file hash matches independently generated digest");
            long HashAllocation = GC.GetTotalAllocatedBytes(true) - BeforeHash;

            long BeforeSync = GC.GetTotalAllocatedBytes(true);
            var Plan = ConfigSync.Preview(new() { HomePath = SourceRoot }, new() { HomePath = TargetRoot }, new());
            Require(Plan.FileList.Count == 1 && Plan.TotalBytes == FileSize, "large file included in preview");
            string Backup = ConfigSync.Apply(Plan, Path.Combine(Root, "backups"));
            long SyncAllocation = GC.GetTotalAllocatedBytes(true) - BeforeSync;
            Require(SettingsStore.FileHash(Target) == SourceHash, "large file copied correctly");
            Require(!File.GetAttributes(Target).HasFlag(FileAttributes.ReadOnly), "copy remains writable when its source is read-only");
            Require(SettingsStore.FileHash(Path.Combine(Backup, "skills", "large.bin")) == TargetHash, "large original backed up correctly");

            var RollbackPlan = new SyncPlan { DestinationRoot = TargetRoot };
            RollbackPlan.FileList.Add(new(Target, Path.Combine(Backup, "skills", "large.bin"), null, SourceHash));
            RollbackPlan.FileList.Add(new(Path.Combine(TargetRoot, "missing.bin"), Path.Combine(Root, "missing-source"), null, null));
            long BeforeRollback = GC.GetTotalAllocatedBytes(true);
            bool Failed = false;
            try { ConfigSync.Apply(RollbackPlan, Path.Combine(Root, "rollback-backups")); }
            catch (IOException Error) when (Error.InnerException is FileNotFoundException) { Failed = true; }
            long RollbackAllocation = GC.GetTotalAllocatedBytes(true) - BeforeRollback;
            Require(Failed && SettingsStore.FileHash(Target) == SourceHash, "large file restored after a later copy failure");
            Require(!Directory.EnumerateFiles(Root, "*.manager-*.tmp", SearchOption.AllDirectories).Any(), "no temporary copies left behind");

            Console.WriteLine($"64 MiB file: hash={HashAllocation:N0} B; preview+apply={SyncAllocation:N0} B; rollback={RollbackAllocation:N0} B allocated");
            Require(HashAllocation < AllocationBudget, "hash allocation remains below 8 MiB");
            Require(SyncAllocation < AllocationBudget, "preview and apply allocation remains below 8 MiB");
            Require(RollbackAllocation < AllocationBudget, "rollback allocation remains below 8 MiB");
            Console.WriteLine("PASS streaming memory, contents, backup and rollback checks");
            return 0;
        }
        catch (Exception Error) { Console.Error.WriteLine(Error); return 1; }
        finally
        {
            if (File.Exists(Source)) File.SetAttributes(Source, FileAttributes.Normal);
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static string WriteFixture(string FilePath, byte Value)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
        byte[] BufferList = new byte[64 * 1024];
        Array.Fill(BufferList, Value);
        using var Hasher = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        using var Stream = File.Create(FilePath);
        for (int Written = 0; Written < FileSize; Written += BufferList.Length)
        {
            Stream.Write(BufferList);
            Hasher.AppendData(BufferList);
        }
        return Convert.ToHexString(Hasher.GetHashAndReset());
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException(Message);
    }
}
