$ErrorActionPreference = 'Stop'
$CandidateList = [Collections.Generic.List[string]]::new()
$ConfigPath = Join-Path $PSScriptRoot '..\config.json'
if (Test-Path -LiteralPath $ConfigPath) {
    $Config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    if ($Config.cli_path) { $CandidateList.Add($Config.cli_path) }
}
$SettingsPath = Join-Path $env:LOCALAPPDATA 'CodexInstanceManager\instances.json'
if (Test-Path -LiteralPath $SettingsPath) {
    $Settings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json
    if ($Settings.Library.RepositoryPath) { $CandidateList.Add((Join-Path $Settings.Library.RepositoryPath 'mmcodex.exe')) }
}
$Directory = [IO.DirectoryInfo]::new($PSScriptRoot)
while ($Directory) {
    $CandidateList.Add((Join-Path $Directory.FullName 'mmcodex.exe'))
    $Directory = $Directory.Parent
}
$Command = Get-Command mmcodex.exe -CommandType Application -ErrorAction SilentlyContinue
if ($Command) { $CandidateList.Add($Command.Source) }
$CliPath = $CandidateList | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $CliPath) { throw '找不到 mmcodex.exe 请在管理器规则与技能库页选择仓库 或在 CLI 目录运行 install 更新当前实例路径' }
& $CliPath @args
exit $LASTEXITCODE
