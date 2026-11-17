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
    if ($Settings.Library.RepositoryPath) { $CandidateList.Add((Join-Path $Settings.Library.RepositoryPath 'AIMoreMoreWork.Cli.exe')) }
}
$Directory = [IO.DirectoryInfo]::new($PSScriptRoot)
while ($Directory) {
    $CandidateList.Add((Join-Path $Directory.FullName 'AIMoreMoreWork.Cli.exe'))
    $Directory = $Directory.Parent
}
$Command = Get-Command AIMoreMoreWork.Cli.exe -CommandType Application -ErrorAction SilentlyContinue
if ($Command) { $CandidateList.Add($Command.Source) }
$CliPath = $CandidateList | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $CliPath) { throw '找不到 AIMoreMoreWork.Cli.exe 请使用 CLI 绝对路径 设定当前 Skill 的 cli_path 或将 CLI 所在目录加入 PATH' }
& $CliPath @args
exit $LASTEXITCODE
