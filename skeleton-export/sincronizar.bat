@echo off
color 0A
echo ===============================================
echo    SINCRONIZACAO DO REPOSITORIO GIT
echo ===============================================
echo.

:MENU
echo Escolha uma opcao:
echo 1 - Sincronizar normalmente
echo 2 - Resolver conflito (stash alteracoes locais)
echo 3 - Resolver conflito (commit alteracoes locais)
echo 4 - Resolver conflito (descartar alteracoes locais)
echo 5 - Sair
echo.

set /p opcao=Digite o numero da opcao desejada: 

if "%opcao%"=="1" goto SINCRONIZAR
if "%opcao%"=="2" goto STASH
if "%opcao%"=="3" goto COMMIT
if "%opcao%"=="4" goto DESCARTAR
if "%opcao%"=="5" goto SAIR

echo.
echo Opcao invalida! Tente novamente.
echo.
goto MENU

:SINCRONIZAR
echo.
echo Iniciando sincronizacao com o Git...
echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0sync-git.ps1"
goto VERIFICAR

:STASH
echo.
echo Guardando alteracoes locais temporariamente...
echo.
powershell -ExecutionPolicy Bypass -Command "git stash"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERRO: Falha ao guardar alteracoes locais!
    echo.
    goto FIM
)

echo Baixando alteracoes do repositorio remoto...
powershell -ExecutionPolicy Bypass -Command "git pull origin master"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERRO: Falha ao baixar alteracoes do repositorio remoto!
    echo.
    goto FIM
)

echo Reaplicando alteracoes locais...
powershell -ExecutionPolicy Bypass -Command "git stash pop"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo AVISO: Houve conflitos ao reaplicar suas alteracoes locais.
    echo Voce precisa resolver os conflitos manualmente antes de continuar.
    echo.
) else (
    color 0A
    echo.
    echo Alteracoes locais reaplicadas com sucesso!
    echo.
)
goto FIM

:COMMIT
echo.
echo Fazendo commit das alteracoes locais...
echo.
set /p mensagem=Digite a mensagem do commit: 
powershell -ExecutionPolicy Bypass -Command "git add ."
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERRO: Falha ao adicionar arquivos para commit!
    echo.
    goto FIM
)

powershell -ExecutionPolicy Bypass -Command "git commit -m \"%mensagem%\""
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERRO: Falha ao fazer commit das alteracoes!
    echo.
    goto FIM
)

echo Baixando alteracoes do repositorio remoto...
powershell -ExecutionPolicy Bypass -Command "git pull origin master"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo AVISO: Houve conflitos ao mesclar com o repositorio remoto.
    echo Voce precisa resolver os conflitos manualmente antes de continuar.
    echo.
) else (
    color 0A
    echo.
    echo Alteracoes mescladas com sucesso!
    echo.
)
goto FIM

:DESCARTAR
echo.
echo ATENCAO: Esta opcao descartara TODAS as alteracoes locais nao commitadas!
set /p confirma=Tem certeza que deseja continuar? (S/N): 
if /i "%confirma%"=="S" (
    echo Descartando alteracoes locais...
    powershell -ExecutionPolicy Bypass -Command "git checkout -- ."
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo ERRO: Falha ao descartar alteracoes locais!
        echo.
        goto FIM
    )
    
    echo Baixando alteracoes do repositorio remoto...
    powershell -ExecutionPolicy Bypass -Command "git pull origin master"
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo ERRO: Falha ao baixar alteracoes do repositorio remoto!
        echo.
    ) else (
        color 0A
        echo.
        echo Alteracoes do repositorio remoto baixadas com sucesso!
        echo.
    )
) else (
    echo Operacao cancelada pelo usuario.
    goto MENU
)
goto FIM

:VERIFICAR
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
goto FIM

:SAIR
exit

:FIM
echo Pressione qualquer tecla para sair...
pause > nul