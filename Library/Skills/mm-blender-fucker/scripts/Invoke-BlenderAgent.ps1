[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string[]]$AgentArgs,
    [string]$PythonFile,
    [string]$JsonFile
)

$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw 'Use PowerShell 7 to preserve native JSON arguments'
}

if ($PythonFile -and $JsonFile) {
    throw 'PythonFile and JsonFile cannot be combined'
}

$RuntimePath = Join-Path $PSScriptRoot '..\references\blender-runtime.json'
$Runtime = Get-Content -LiteralPath $RuntimePath -Raw | ConvertFrom-Json
foreach ($Executable in @($Runtime.command, $Runtime.blender)) {
    if (!(Test-Path -LiteralPath $Executable -PathType Leaf)) {
        throw "Configured executable is missing: $Executable"
    }
}

$Command = $AgentArgs[0]
if ($Command -in @('mcp', '_daemon', 'reset')) {
    throw "Use task-owned CLI sessions instead of $Command"
}

if ($Command -in @('start', 'call', 'show', 'status', 'stop') -and
    $AgentArgs -notcontains '--name' -and $AgentArgs -notcontains '--help') {
    throw 'Specify --name with a task-owned session name'
}

if ($Command -eq 'stop' -and $AgentArgs -contains '--all') {
    throw 'Stop only the task-owned session by name'
}

if ($Command -eq 'start' -and $AgentArgs -notcontains '--help') {
    if ($AgentArgs -notcontains '--out') {
        throw 'Specify --out with an absolute task preview directory'
    }
    if ($AgentArgs -notcontains '--blender') {
        $AgentArgs += @('--blender', $Runtime.blender)
    }
}

if ($PythonFile) {
    if ($Command -ne 'call' -or $AgentArgs[-1] -ne 'exec_python') {
        throw 'PythonFile requires call --name <session> exec_python without inline JSON'
    }
    $ScriptPath = (Resolve-Path -LiteralPath $PythonFile).Path
    $SourceLiteral = Get-Content -LiteralPath $ScriptPath -Raw -Encoding utf8 | ConvertTo-Json -Compress
    $PathLiteral = ConvertTo-Json -InputObject $ScriptPath -Compress
    $Code = "__file__ = $PathLiteral`n__name__ = '__main__'`nexec(compile($SourceLiteral, __file__, 'exec'), globals())"
    $AgentArgs += ConvertTo-Json -InputObject @{ code = $Code } -Compress -Depth 10
}

if ($JsonFile) {
    if ($Command -ne 'call') {
        throw 'JsonFile requires a call command without inline JSON'
    }
    $AgentArgs += Get-Content -LiteralPath $JsonFile -Raw -Encoding utf8
}

& $Runtime.command @AgentArgs
if ($LASTEXITCODE -ne 0) {
    throw "blender-agent command failed with exit code $LASTEXITCODE"
}
