$ErrorActionPreference = 'Stop'
$Config = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\config.json') -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $Config.cli_path -PathType Leaf)) {
    throw "Codex 管理器 CLI 不存在 $($Config.cli_path)"
}
& $Config.cli_path @args
exit $LASTEXITCODE
