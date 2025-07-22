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

# Verificar se estamos em um repositório Git
if (-not (Test-Path -Path ".git" -PathType Container)) {
    Mostrar-Mensagem "\nErro: Este diretório não é um repositório Git válido!" $vermelho
    exit 1
}

# Verificar se o repositório remoto está configurado
$remoteUrl = git config --get remote.origin.url
if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
    Mostrar-Mensagem "\nErro: Não há repositório remoto configurado!" $vermelho
    exit 1
}
Mostrar-Mensagem "\nRepositório remoto: $remoteUrl" $verde

# Verificar status atual
Mostrar-Mensagem "\nVerificando status do repositório..." $verde
Executar-Comando "git status"

# Verificar se há conflitos pendentes
$statusOutput = git status --porcelain
if ($statusOutput -match "^UU ") {
    Mostrar-Mensagem "\nErro: Existem conflitos de merge pendentes que precisam ser resolvidos antes de continuar!" $vermelho
    exit 1
}

# Perguntar se deseja continuar
$continuar = Read-Host "\nDeseja continuar com a sincronização? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Mostrar-Mensagem "Operação cancelada pelo usuário." $vermelho
    exit 0
}

# Detectar a branch atual
try {
    $branchAtual = git branch --show-current
    if ([string]::IsNullOrWhiteSpace($branchAtual)) {
        $branchAtual = "master"
        Mostrar-Mensagem "\nNão foi possível detectar a branch atual. Usando 'master' como padrão." $amarelo
    } else {
        Mostrar-Mensagem "\nBranch atual: $branchAtual" $verde
    }
} catch {
    $branchAtual = "master"
    Mostrar-Mensagem "\nErro ao detectar a branch atual. Usando 'master' como padrão." $amarelo
}

# Pull das alterações remotas
Mostrar-Mensagem "\nBaixando alterações do repositório remoto..." $verde
Executar-Comando "git pull origin $branchAtual"

# Adicionar arquivos modificados
Mostrar-Mensagem "\nAdicionando arquivos modificados..." $verde
Executar-Comando "git add ."

# Verificar se há alterações para commit
$statusOutput = git status --porcelain
if ([string]::IsNullOrWhiteSpace($statusOutput)) {
    Mostrar-Mensagem "\nNão há alterações para commit." $amarelo
} else {
    # Solicitar mensagem de commit
    $mensagem = Read-Host "\nDigite a mensagem do commit"
    if ([string]::IsNullOrWhiteSpace($mensagem)) {
        $mensagem = "Atualização: $(Get-Date -Format "dd/MM/yyyy HH:mm")"
    }

    # Realizar o commit
    Mostrar-Mensagem "\nRealizando commit com a mensagem: '$mensagem'" $verde
    Executar-Comando "git commit -m `"$mensagem`""
}

# Verificar se há commits para push
$localCommits = git rev-list --count origin/$branchAtual..$branchAtual 2>$null
if ($LASTEXITCODE -ne 0) {
    # Se o comando falhar, pode ser porque a branch remota não existe
    Mostrar-Mensagem "\nA branch remota pode não existir. Tentando push com --set-upstream..." $amarelo
    Mostrar-Mensagem "\nEnviando alterações para o repositório remoto..." $verde
    Executar-Comando "git push --set-upstream origin $branchAtual"
} elseif ($localCommits -gt 0) {
    # Se há commits locais que não estão no remoto
    Mostrar-Mensagem "\nEnviando $localCommits commit(s) para o repositório remoto..." $verde
    Executar-Comando "git push origin $branchAtual"
} else {
    Mostrar-Mensagem "\nNão há commits para enviar ao repositório remoto." $amarelo
}

# Resumo da sincronização
Mostrar-Mensagem "\n----------------------------------------" $verde
Mostrar-Mensagem "Resumo da sincronização:" $verde
Mostrar-Mensagem "- Repositório: $remoteUrl" $verde
Mostrar-Mensagem "- Branch: $branchAtual" $verde
Mostrar-Mensagem "- Data/Hora: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")" $verde
Mostrar-Mensagem "----------------------------------------" $verde
Mostrar-Mensagem "\nSincronização concluída com sucesso!" $verde