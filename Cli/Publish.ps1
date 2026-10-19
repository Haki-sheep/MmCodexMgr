param([string]$Destination)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent
if (-not $Destination) { $Destination = $RepoRoot }
$Output = Join-Path $PSScriptRoot 'bin\publish'
& dotnet publish (Join-Path $PSScriptRoot 'MmCodexMgr.Cli.csproj') -c Release -r win-x64 --self-contained false -p:PublishSelfContained=false -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:DebugType=None -p:DebugSymbols=false -o $Output --nologo
if ($LASTEXITCODE -ne 0) { throw "CLI publish failed exit=$LASTEXITCODE" }
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $Output 'mmcodex.exe') -Destination (Join-Path $Destination 'mmcodex.exe') -Force
Write-Output (Join-Path $Destination 'mmcodex.exe')
