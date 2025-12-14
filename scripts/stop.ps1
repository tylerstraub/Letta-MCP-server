# Stop Letta MCP Server (PowerShell)
# Usage: .\scripts\stop.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

# Find running server process
$runningProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
$serverPid = $null

foreach ($proc in $runningProcesses) {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        if ($cmdLine -like "*src/index.js --http*") {
            $serverPid = $proc.Id
            break
        }
    } catch {
        # Ignore errors when checking command line
    }
}

if (-not $serverPid) {
    Write-Host "INFO: Server is not running" -ForegroundColor Cyan
    exit 0
}

Write-Host "Stopping Letta MCP Server (PID: $serverPid)..." -ForegroundColor Yellow

# Try graceful shutdown first
try {
    Stop-Process -Id $serverPid -ErrorAction Stop
} catch {
    # Process might have already exited
}

# Wait up to 5 seconds for graceful shutdown
$waited = 0
while ($waited -lt 5) {
    $stillRunning = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
    if (-not $stillRunning) {
        Write-Host "SUCCESS: Server stopped gracefully" -ForegroundColor Green
        if (Test-Path ".server.pid") {
            Remove-Item ".server.pid" -Force
        }
        exit 0
    }
    Start-Sleep -Seconds 1
    $waited++
}

# Force kill if still running
$stillRunning = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($stillRunning) {
    Write-Host "WARNING: Server didn't stop gracefully, forcing shutdown..." -ForegroundColor Yellow
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Verify it's stopped
$stillRunning = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($stillRunning) {
    Write-Host "ERROR: Failed to stop server" -ForegroundColor Red
    exit 1
} else {
    Write-Host "SUCCESS: Server stopped" -ForegroundColor Green
    if (Test-Path ".server.pid") {
        Remove-Item ".server.pid" -Force
    }
}
