@echo off
echo ====================================
echo Enable CEP Debug Mode
echo ====================================
echo.

echo Checking for CEP installations...
echo.

:: Use a simpler approach - just enable for common versions
powershell -ExecutionPolicy Bypass -Command "foreach ($v in 9,10,11,12) { $p=\"HKCU:\Software\Adobe\CSXS.$v\"; if (!(Test-Path $p)) { New-Item -Path $p -Force | Out-Null }; Set-ItemProperty -Path $p -Name 'PlayerDebugMode' -Value '1' -Type String; Write-Host \"Enabled debug mode for CSXS.$v\" -ForegroundColor Green }"

echo.
echo CEP Debug Mode ENABLED for versions 9-12
echo (Covers After Effects 2019-2025)
echo.
echo Please restart After Effects for changes to take effect.
echo.
echo Press any key to close...
pause >nul