@echo off
echo Iniciando servidor de desenvolvimento do PortalRM...
echo.
powershell -ExecutionPolicy Bypass -Command "$env:NODE_ENV='development'; npx tsx server/index.ts"
pause