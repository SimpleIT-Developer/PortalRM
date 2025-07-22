@echo off
color 0A
echo ===============================================
echo    SINCRONIZACAO DO REPOSITORIO GIT
echo ===============================================
echo.
echo Iniciando sincronizacao com o Git...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0sync-git.ps1"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERRO: A sincronizacao falhou com codigo de erro %ERRORLEVEL%
    echo.
) else (
    color 0A
    echo.
    echo Sincronizacao concluida com sucesso!
    echo.
)

echo Pressione qualquer tecla para sair...
pause > nul