param([string]$Instance = '1')
$ErrorActionPreference = 'Stop'
$SkillPath = $PSScriptRoot
& (Join-Path $SkillPath 'scripts\aimoremorework.ps1') install --instance $Instance --skill $SkillPath
exit $LASTEXITCODE
