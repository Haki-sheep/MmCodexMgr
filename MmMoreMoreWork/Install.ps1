param([string]$Instance = '1')
$ErrorActionPreference = 'Stop'
$SkillPath = Join-Path $PSScriptRoot 'moremore-work'
& (Join-Path $SkillPath 'scripts\mmcodex.ps1') install --instance $Instance --skill $SkillPath
exit $LASTEXITCODE
