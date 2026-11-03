using Microsoft.Win32;

namespace CodexInstanceManager;

public sealed class StartupRegistration
{
    /// <summary> 当前用户的独立启动项名称 </summary>
    private const string ValueName = "MmCodexMgr";
    /// <summary> 当前用户的启动项注册表路径 </summary>
    private readonly string RegistryPath;
    /// <summary> 带完整程序路径的后台启动命令 </summary>
    private readonly string Command;

    public StartupRegistration(string ExecutablePath, string RegistryPath = @"Software\Microsoft\Windows\CurrentVersion\Run")
    {
        this.RegistryPath = RegistryPath;
        Command = "\"" + Path.GetFullPath(ExecutablePath) + "\" --background";
    }

    public bool IsEnabled
    {
        get
        {
            using var Key = Registry.CurrentUser.OpenSubKey(RegistryPath);
            return Key?.GetValue(ValueName) is string Value && Value.Length != 0;
        }
    }

    /// <summary>
    /// 只修改当前用户的管理器启动项 不启动 Codex 实例
    /// </summary>
    public void SetEnabled(bool Enabled)
    {
        if (Enabled)
        {
            using var Key = Registry.CurrentUser.CreateSubKey(RegistryPath);
            Key.SetValue(ValueName, Command, RegistryValueKind.String);
        }
        else
        {
            using var Key = Registry.CurrentUser.OpenSubKey(RegistryPath, true);
            Key?.DeleteValue(ValueName, false);
        }
    }
}
