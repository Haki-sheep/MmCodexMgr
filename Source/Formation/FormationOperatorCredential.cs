using System.Security.Cryptography;
using System.Text;

namespace CodexInstanceManager;

public static class FormationOperatorCredential
{
    private static string CredentialPath => Path.Combine(ManagerPaths.Root, "formation", "operator.dat");

    public static void Save(string Credential, string? FilePath = null)
    {
        string Target = FilePath ?? CredentialPath;
        Directory.CreateDirectory(Path.GetDirectoryName(Target)!);
        byte[] PlainList = Encoding.UTF8.GetBytes(Credential);
        try { SettingsStore.AtomicWrite(Target, ProtectedData.Protect(PlainList, null, DataProtectionScope.CurrentUser)); }
        finally { CryptographicOperations.ZeroMemory(PlainList); }
    }

    public static string Load(string? FilePath = null)
    {
        string Target = FilePath ?? CredentialPath;
        if (!File.Exists(Target)) throw new InvalidOperationException("本机编队凭据尚未建立 请启动新版 Mm AgentWork Mgr");
        byte[] PlainList = ProtectedData.Unprotect(File.ReadAllBytes(Target), null, DataProtectionScope.CurrentUser);
        try { return Encoding.UTF8.GetString(PlainList); }
        finally { CryptographicOperations.ZeroMemory(PlainList); }
    }
}
