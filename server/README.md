# Servidor de Updates - Indicador de Pintores

Servidor self-hosted para atualização automática da extensão Chrome.

## Requisitos

- Node.js 18+
- npm ou yarn
- Chrome (para empacotar a extensão)

## Instalação

```bash
cd server
npm install
```

## Configuração Inicial

### 1. Gere as chaves da extensão

```bash
npm run generate-keys
```

Isso cria:
- `public/extension.pem` - Chave privada (NUNCA compartilhe!)
- `public/extension.pub` - Chave pública

### 2. Atualize o manifest.json

Edite o campo `update_url` no `manifest.json` na raiz do projeto:

```json
{
  "update_url": "https://SEU-SERVIDOR.COM/update.xml"
}
```

### 3. Configure a URL base (opcional)

No servidor, defina a variável de ambiente:

```bash
BASE_URL=https://seu-servidor.com npm start
```

## Empacotando a Extensão

### Opção A: Usando Chrome instalado

```bash
npm run package
```

### Opção B: Manual (Chrome não encontrado)

1. Abra Chrome e vá em `chrome://extensions/`
2. Ative **Developer mode**
3. Clique em **Pack extension**
4. Selecione a pasta raiz do projeto
5. Selecione a chave privada: `server/public/extension.pem`
6. Copie o arquivo `.crx` gerado para `server/public/indicador-pintores.crx`

## Executando o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `/` | Informações do servidor |
| `/version` | Versão atual e Extension ID |
| `/update.xml` | XML de update (para Chrome) |
| `/indicador-pintores.crx` | Arquivo instalável |
| `POST /package` | Reempacota extensão |

## Instalação pelos Usuários

### Opção 1: Instalar diretamente o CRX

1. Acesse `https://SEU-SERVIDOR.COM/indicador-pintores.crx`
2. Arraste o arquivo para Chrome
3. Aceite as permissões

### Opção 2: Forçar instalação via política (Enterprise)

Configure no Chrome:

```json
{
  "ExtensionSettings": {
    "<EXTENSION_ID>": {
      "update_url": "https://SEU-SERVIDOR.COM/update.xml",
      "override_update_url": true
    }
  }
}
```

## Atualizando a Extensão

1. Faça as alterações no código
2. Atualize a versão em `manifest.json`
3. Execute `npm run package`
4. O servidor automaticamente servirá a nova versão

O Chrome verifica updates a cada ~5 horas. Para forçar atualização:

1. Vá em `chrome://extensions`
2. Clique em **Update**

## Estrutura de Arquivos

```
server/
├── src/
│   ├── index.ts          # Servidor Fastify
│   └── package-extension.ts  # Script de empacotamento
├── public/
│   ├── indicador-pintores.crx  # Arquivo instalável
│   ├── extension.pem           # Chave privada
│   └── extension.pub           # Chave pública
├── package.json
└── tsconfig.json
```
