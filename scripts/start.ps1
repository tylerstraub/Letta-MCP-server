# Start Letta MCP Server (PowerShell)
# Usage: .\scripts\start.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

# Check if server is already running
$runningProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
$serverRunning = $false
$serverPid = $null

foreach ($proc in $runningProcesses) {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        if ($cmdLine -like "*src/index.js --http*") {
            $serverRunning = $true
            $serverPid = $proc.Id
            break
        }
    } catch {
        # Ignore errors when checking command line
    }
}

if ($serverRunning) {
    Write-Host "WARNING: Server is already running!" -ForegroundColor Yellow
    Write-Host "   PID: $serverPid"
    Write-Host "   Use '.\scripts\stop.ps1' to stop it first, or '.\scripts\restart.ps1' to restart"
    exit 1
}

# Load environment variables from .env file
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
} else {
    Write-Host "WARNING: .env file not found" -ForegroundColor Yellow
}

# Check required environment variables
if (-not $env:LETTA_BASE_URL) {
    Write-Host "ERROR: LETTA_BASE_URL not set in .env file" -ForegroundColor Red
    exit 1
}

# Ensure node_modules are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

$port = if ($env:PORT) { $env:PORT } else { "3001" }

Write-Host "Starting Letta MCP Server..." -ForegroundColor Green
Write-Host "   Base URL: $env:LETTA_BASE_URL"
Write-Host "   Port: $port"
Write-Host "   Logs: logs/server.log"

# Start server in background using Start-Process
$logFile = Join-Path $ProjectDir "logs\server.log"
$process = Start-Process -FilePath "node" -ArgumentList "src/index.js --http" -WorkingDirectory $ProjectDir -PassThru -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $logFile

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Check if server started successfully
$stillRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
if ($stillRunning) {
    Write-Host "SUCCESS: Server started successfully!" -ForegroundColor Green
    Write-Host "   PID: $($process.Id)"
    Write-Host "   Health check: http://localhost:$port/health"
    Write-Host "   View logs: Get-Content logs\server.log -Wait"
    $process.Id | Out-File -FilePath ".server.pid" -Encoding ASCII
} else {
    Write-Host "ERROR: Server failed to start. Check logs\server.log for details" -ForegroundColor Red
    exit 1
}
