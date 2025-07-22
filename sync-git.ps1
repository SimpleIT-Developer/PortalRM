# Script de sincronização com o Git
# Autor: SimpleIT Developer
# Data: $(Get-Date -Format "dd/MM/yyyy")

# Cores para melhor visualização
$verde = "\033[0;32m"
$amarelo = "\033[0;33m"
$vermelho = "\033[0;31m"
$reset = "\033[0m"

function Mostrar-Mensagem($mensagem, $cor) {
    Write-Host "$cor$mensagem$reset"
}

function Executar-Comando($comando) {
    Mostrar-Mensagem "Executando: $comando" $amarelo
    Invoke-Expression $comando
    if ($LASTEXITCODE -ne 0) {
        Mostrar-Mensagem "Erro ao executar o comando!" $vermelho
        exit 1
    }
}

# Verificar status atual
Mostrar-Mensagem "\nVerificando status do repositório..." $verde
Executar-Comando "git status"

# Perguntar se deseja continuar
$continuar = Read-Host "\nDeseja continuar com a sincronização? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Mostrar-Mensagem "Operação cancelada pelo usuário." $vermelho
    exit 0
}

# Pull das alterações remotas
Mostrar-Mensagem "\nBaixando alterações do repositório remoto..." $verde
Executar-Comando "git pull origin main"

# Adicionar arquivos modificados
Mostrar-Mensagem "\nAdicionando arquivos modificados..." $verde
Executar-Comando "git add ."

# Solicitar mensagem de commit
$mensagem = Read-Host "\nDigite a mensagem do commit"
if ([string]::IsNullOrWhiteSpace($mensagem)) {
    $mensagem = "Atualização: $(Get-Date -Format "dd/MM/yyyy HH:mm")"
}

# Realizar o commit
Mostrar-Mensagem "\nRealizando commit com a mensagem: '$mensagem'" $verde
Executar-Comando "git commit -m `"$mensagem`""

# Push para o repositório remoto
Mostrar-Mensagem "\nEnviando alterações para o repositório remoto..." $verde
Executar-Comando "git push origin master"

Mostrar-Mensagem "\nSincronização concluída com sucesso!" $verde