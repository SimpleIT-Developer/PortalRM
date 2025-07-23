# TOTVS RM Authentication Service

## Configuração de Endpoint

Este sistema permite configurar o endpoint do servidor TOTVS RM através do arquivo de configuração.

### Arquivo de Configuração

O endpoint principal é definido no arquivo `env/endpoint.txt`:
```
erp-simpleit.sytes.net:8051
```

### Como Alterar o Endpoint

1. Edite o arquivo `env/endpoint.txt`
2. Coloque apenas o host e porta (sem protocolo)
3. Exemplo: `seu-servidor.com:8051`

### Endpoints de Fallback

- Arquivo principal: `client/public/endpoints.json`
- Configuração avançada: `config/endpoints.json`

### Localizações dos Arquivos de Configuração

1. **Endpoint Principal**: `env/endpoint.txt`
2. **Lista de Endpoints (Frontend)**: `client/public/endpoints.json` 
3. **Configuração Avançada**: `config/endpoints.json`

O sistema utiliza o arquivo `env/endpoint.txt` como fonte principal, com fallback para as outras configurações se necessário.