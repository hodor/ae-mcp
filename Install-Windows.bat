@echo off

:: Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ====================================
    echo Administrator Privileges Required
    echo ====================================
    echo.
    echo This installer needs admin rights to install the CEP extension
    echo to Program Files.
    echo.
    echo Please right-click Install-Windows.bat and select
    echo "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: Navigate to the script's directory
cd /d "%~dp0"

:: Run the installation
node install.js
if %errorlevel% neq 0 (
    echo.
    echo Installation failed!
    pause
    exit /b 1
)

:: Enable debug mode
echo.
echo Enabling CEP debug mode...
powershell -ExecutionPolicy Bypass -Command "foreach ($v in 9,10,11,12) { $p=\"HKCU:\Software\Adobe\CSXS.$v\"; if (!(Test-Path $p)) { New-Item -Path $p -Force | Out-Null }; Set-ItemProperty -Path $p -Name 'PlayerDebugMode' -Value '1' -Type String; Write-Host \"  Enabled debug mode for CSXS.$v\" -ForegroundColor Green }"
echo [OK] Debug mode enabled

:: Keep window open
pause