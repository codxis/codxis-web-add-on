# Indicador de Pintores - Extensão Chrome

Extensão Chrome para gerenciar indicadores de vendas no sistema Codxis Web. Permite cadastrar, consultar, editar e excluir indicadores, além de aplicar automaticamente pontos em vendas finalizadas.

## Funcionalidades

### 1. Gestão de Indicadores
- **Cadastrar** novos indicadores (nome, CPF, apelido)
- **Consultar** lista de indicadores com filtros
- **Editar** dados dos indicadores
- **Excluir** indicadores (soft delete)
- **Resgatar pontos** acumulados

### 2. Aplicação Automática de Pontos
- Ao finalizar uma venda (PV ou NFCe), os pontos são automaticamente creditados ao indicador selecionado
- Conversão: **1 ponto = R$ 0,50**
- Identificação do indicador via campo personalizado na interface de vendas

### 3. Interface
- Menu de gestão de indicadores na página inicial
- Campo de seleção de indicador na tela de vendas (PDV/NFCe)
- Modal para operações de CRUD
- Design responsivo e intuitivo

## Estrutura de Arquivos

```
extension/
├── manifest.json              # Configuração da extensão
├── src/
│   ├── contents/
│   │   ├── content.js        # Script para página de vendas (PDV)
│   │   ├── handlers.js       # Handlers de operações CRUD
│   │   ├── modal.js          # Renderização de modais
│   │   ├── menu.js           # Injeção do menu na página inicial
│   │   ├── create-referrer.js # Criação de elementos do menu
│   │   └── utils.js          # Funções utilitárias
│   ├── popup/
│   │   ├── index.html        # Popup da extensão
│   │   └── popup.js          # Lógica do popup
│   ├── shared/
│   │   ├── api.js            # Cliente API REST
│   │   └── constants.js      # Configurações (API base, keys)
│   └── css/
│       ├── modal.css         # Estilos dos modais
│       └── custom-select.css # Estilos do select customizado
```

## Instalação

1. Clone o repositório
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o **Modo do desenvolvedor** (canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `extension/`

## Configuração

### URLs de Ativação (manifest.json)
A extensão ativa-se automaticamente nas seguintes páginas:
- Página inicial: `https://web.codxis.api.br/sistema/pages/privado/index/*`
- PDV/NFCe: `https://web.codxis.api.br/sistema/pages/privado/nfce/emissao/pdv/*`

### API Backend
A extensão consome uma API serverless (Supabase Functions) configurada em `src/shared/constants.js`:
- **Endpoint**: `https://iofeislqynfuerypxrpt.supabase.co/functions/v1/indicadores-api`

## Uso

### Na Página de Vendas (PDV/NFCe)
1. Selecione um indicador no campo "Indicador" (campo personalizado)
2. Finalize a venda normalmente (botão PV ou NFCe)
3. Os pontos serão automaticamente creditados ao indicador selecionado

### Na Página Inicial
1. Clique no ícone da extensão ou navegue até a página inicial do sistema
2. Use o menu "Indicadores" para:
   - Cadastrar novos indicadores
   - Filtrar e buscar indicadores existentes
   - Editar informações de indicadores
   - Excluir indicadores
   - Resgatar pontos acumulados

## Conversão de Pontos

| Valor da Venda | Pontos Creditados |
|----------------|-------------------|
| R$ 10,00       | 20 pontos         |
| R$ 50,00       | 100 pontos        |
| R$ 100,00      | 200 pontos        |
| R$ 500,00      | 1.000 pontos      |

Fórmula: `pontos = valor_venda / PONTOS_VALOR_REAIS` (onde PONTOS_VALOR_REAIS = 0.50)

## Tecnologias

- **JavaScript (ES6+)**
- **Chrome Extension API (Manifest V3)**
- **Supabase Functions** (Backend)
- **CSS3** (Estilização)
- **HTML5**

## Licença

Proprietário - Codxis
