# Builds yoinks+ and installs it globally as a standalone copy (not a link),
# so the project folder can be moved or deleted afterwards. Then approves the
# new `yoinks` command with nvm's firewall and reshims.
#
# Usage (from anywhere):  powershell -ExecutionPolicy Bypass -File scripts\install-global.ps1

$ErrorActionPreference = 'Stop'

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "x $Name failed (exit code $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# run from the project root, wherever the script was called from
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
$packDir = Join-Path ([System.IO.Path]::GetTempPath()) "yoinks-plus-pack-$PID"

try {
    Invoke-Step 'building' { npm run build }

    # pack into a temp folder so no .tgz is left in the repo
    New-Item -ItemType Directory -Force $packDir | Out-Null
    Invoke-Step 'packing' { npm pack --pack-destination $packDir }
    $tarball = Get-ChildItem $packDir -Filter '*.tgz' | Select-Object -First 1
    if (-not $tarball) { throw "npm pack didn't produce a .tgz in $packDir" }

    # --ignore-scripts: ffmpeg-static's postinstall downloads ffmpeg from
    # GitHub, which often fails; yoinks uses the ffmpeg on your PATH first
    Invoke-Step 'installing globally' { npm install -g --ignore-scripts $tarball.FullName }

    Invoke-Step 'trusting yoinks in the nvm firewall' { nvm firewall trust module yoinks }
    Invoke-Step 'reshimming' { nvm reshim }

    Invoke-Step 'checking it runs' { yoinks --version }
    Write-Host 'done - yoinks+ is installed' -ForegroundColor Green
}
finally {
    Pop-Location
    Remove-Item -Recurse -Force $packDir -ErrorAction SilentlyContinue
}
