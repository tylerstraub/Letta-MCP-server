# Restart Letta MCP Server (PowerShell)
# Usage: .\scripts\restart.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

Write-Host "Restarting Letta MCP Server..." -ForegroundColor Cyan

# Stop if running (ignore exit code if server not running)
& "$ScriptDir\stop.ps1"
$stopExitCode = $LASTEXITCODE

# Wait a moment
Start-Sleep -Seconds 1

# Start again
& "$ScriptDir\start.ps1"
