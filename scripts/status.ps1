# Check Letta MCP Server status (PowerShell)
# Usage: .\scripts\status.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

# Load environment variables from .env file (for PORT)
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*#') { return }  # Skip comments
        if ([string]::IsNullOrWhiteSpace($_)) { return }  # Skip empty lines
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

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
    Write-Host "ERROR: Server is not running" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Server is running" -ForegroundColor Green
Write-Host "   PID: $serverPid"

# Try to get health status
$port = if ($env:PORT) { $env:PORT } else { "3001" }
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $status = $healthResponse.status
    Write-Host "   Status: $status" -ForegroundColor Green
    Write-Host "   Health: http://localhost:$port/health"
} catch {
    Write-Host "   WARNING: Health endpoint not responding" -ForegroundColor Yellow
}

Write-Host "   Logs: logs/server.log"
