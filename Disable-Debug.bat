@echo off
echo ====================================
echo Disable CEP Debug Mode
echo ====================================
echo.

echo Disabling CEP debug mode...
echo.

:: Disable for common versions
powershell -ExecutionPolicy Bypass -Command "foreach ($v in 9,10,11,12) { $p=\"HKCU:\Software\Adobe\CSXS.$v\"; if (Test-Path $p) { Set-ItemProperty -Path $p -Name 'PlayerDebugMode' -Value '0' -Type String; Write-Host \"Disabled debug mode for CSXS.$v\" -ForegroundColor Yellow }}"

echo.
echo CEP Debug Mode DISABLED
echo.
echo Please restart After Effects for changes to take effect.
echo.
echo Press any key to close...
pause >nul