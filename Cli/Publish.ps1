param([string]$Destination)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent
if (-not $Destination) { $Destination = $RepoRoot }
$Output = Join-Path $PSScriptRoot 'bin\publish'
& dotnet publish (Join-Path $PSScriptRoot 'MmCodexMgr.Cli.csproj') -c Release -r win-x64 --self-contained false -p:PublishSelfContained=false -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:DebugType=None -p:DebugSymbols=false -o $Output --nologo
if ($LASTEXITCODE -ne 0) { throw "CLI publish failed exit=$LASTEXITCODE" }
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
$Target = [System.IO.Path]::GetFullPath((Join-Path $Destination 'mmcodex.exe'))
$DestinationRoot = [System.IO.Path]::GetFullPath($Destination).TrimEnd('\')
if ([System.IO.Path]::GetDirectoryName($Target) -ne $DestinationRoot) { throw 'CLI target escaped destination directory' }
$BackupRoot = Join-Path $DestinationRoot 'bin\update-backup'
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
$Staged = [System.IO.Path]::GetFullPath((Join-Path $BackupRoot ('mmcodex-new-' + [guid]::NewGuid().ToString('N') + '.exe')))
if (-not $Staged.StartsWith($DestinationRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'CLI staging escaped destination directory' }
Copy-Item -LiteralPath (Join-Path $Output 'mmcodex.exe') -Destination $Staged
$Backup = $null
if (Test-Path -LiteralPath $Target) {
    $Backup = [System.IO.Path]::GetFullPath((Join-Path $BackupRoot ('mmcodex-' + [guid]::NewGuid().ToString('N') + '.exe')))
    if (-not $Backup.StartsWith($DestinationRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'CLI backup escaped destination directory' }
    Move-Item -LiteralPath $Target -Destination $Backup
}
try { Move-Item -LiteralPath $Staged -Destination $Target }
catch {
    if ($Backup -and -not (Test-Path -LiteralPath $Target)) { Move-Item -LiteralPath $Backup -Destination $Target }
    throw
}
Write-Output $Target
