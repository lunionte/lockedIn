# Locked-In Extension

Extensão Chrome para produtividade com bloqueio rigoroso de sites.

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Build da extensão

```bash
npm run build
```

Este comando irá:

-   Criar ícones placeholder automaticamente
-   Compilar o código React/TypeScript
-   Copiar manifest.json, rules.json e ícones para a pasta `dist/`

### 3. Carregar no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" (canto superior direito)
3. Clique em "Carregar sem compactação"
4. **Selecione a pasta `dist`** (não a raiz do projeto)

### 4. Personalizar ícones (Opcional)

Os ícones placeholder são apenas pixels cinzas. Para personalizar:

1. Crie ícones PNG nas dimensões 16x16, 48x48 e 128x128 pixels
2. Substitua os arquivos em `public/icons/`
3. Execute `npm run build` novamente

## Uso

1. **Adicionar sites permitidos**: Digite os domínios que você quer acessar durante o bloqueio
2. **Iniciar timer**: Escolha a duração do modo Locked-In
3. **Desativar**: Digite o UUID completo para desbloquear antes do tempo

## Fluxo de Dados (Service Worker ↔ Popup)

### Arquitetura de Comunicação

A extensão utiliza dois canais de comunicação principais:

#### 1. **chrome.runtime.sendMessage** (Popup → Service Worker)

Mensagens unidirecionais para comandos de controle.

```typescript
// Popup envia comandos ao Service Worker
chrome.runtime.sendMessage({
    type: "START_LOCKDOWN" | "STOP_LOCKDOWN",
    endTime?: number,
    whitelist?: string[]
});
```

#### 2. **chrome.storage.local** (Bidirecional)

Estado compartilhado entre Popup e Service Worker.

```typescript
// Estrutura de dados persistida
interface StorageData {
    whitelist: string[]; // Lista de domínios permitidos
    isActive: boolean; // Estado do bloqueio
    endTime: number; // Timestamp de término
    killSwitchUuid: string; // UUID para desbloqueio
}
```

### Fluxo de Inicialização do Lockdown

```
┌─────────────────┐                    ┌──────────────────────┐
│  Popup (React)  │                    │  Service Worker      │
└────────┬────────┘                    └──────────┬───────────┘
         │                                        │
         │ 1. Usuário clica "Iniciar"            │
         │────────────────────────────────────────│
         │                                        │
         │ 2. sendMessage({                      │
         │      type: "START_LOCKDOWN",          │
         │      endTime: timestamp,              │
         │      whitelist: ["site1.com", ...]    │
         │    })                                  │
         │───────────────────────────────────────>│
         │                                        │
         │                                3. Gera UUID
         │                                4. Salva em storage.local:
         │                                   - isActive: true
         │                                   - endTime: timestamp
         │                                   - killSwitchUuid: uuid
         │                                   - whitelist: [...]
         │                                        │
         │                                5. updateBlockingRules()
         │                                   chrome.declarativeNetRequest
         │                                        │
         │                                6. chrome.alarms.create()
         │                                   "endLockdown"
         │                                        │
         │ 7. Polling (1s): loadState()          │
         │    chrome.storage.local.get()         │
         │<───────────────────────────────────────│
         │                                        │
         │ 8. Atualiza UI com dados              │
         │    - remainingTime calculado          │
         │    - Mostra KillSwitch component      │
         │                                        │
```

### Fluxo de Monitoramento Contínuo

```
┌─────────────────┐                    ┌──────────────────────┐
│  Popup (React)  │                    │  Service Worker      │
└────────┬────────┘                    └──────────┬───────────┘
         │                                        │
         │ useEffect com setInterval(1000ms)     │
         │                                        │
    ┌────▼────┐                                  │
    │ Loop:   │                                  │
    │ loadState() cada 1 segundo                 │
    └────┬────┘                                  │
         │                                        │
         │ chrome.storage.local.get([             │
         │   "whitelist",                         │
         │   "isActive",                          │
         │   "endTime",                           │
         │   "killSwitchUuid"                     │
         │ ])                                     │
         │<───────────────────────────────────────│
         │                                        │
         │ Calcula:                               │
         │ remainingTime = endTime - Date.now()   │
         │                                        │
         │ Renderiza UI baseado no estado:        │
         │ - isActive = false → WhitelistManager  │
         │ - isActive = true → KillSwitch         │
         │                                        │
         │                             ┌──────────▼────────┐
         │                             │ chrome.alarms     │
         │                             │ "checkTimer"      │
         │                             │ (a cada 1 minuto) │
         │                             └──────────┬────────┘
         │                                        │
         │                             Verifica se tempo expirou
         │                             Se expirou: stopLockdown()
         │                                        │
```

### Fluxo de Desbloqueio (Kill-Switch)

```
┌─────────────────┐                    ┌──────────────────────┐
│  Popup (React)  │                    │  Service Worker      │
└────────┬────────┘                    └──────────┬───────────┘
         │                                        │
         │ 1. Usuário digita UUID completo       │
         │    (caractere por caractere)          │
         │                                        │
         │ 2. Validação local: input === uuid    │
         │                                        │
         │ 3. sendMessage({                      │
         │      type: "STOP_LOCKDOWN"            │
         │    })                                  │
         │───────────────────────────────────────>│
         │                                        │
         │                                4. chrome.storage.local.set():
         │                                   - isActive: false
         │                                   - endTime: null
         │                                   - killSwitchUuid: ""
         │                                        │
         │                                5. chrome.declarativeNetRequest
         │                                   removeRuleIds: [1]
         │                                   (remove bloqueio)
         │                                        │
         │                                6. chrome.alarms.clear()
         │                                   "endLockdown"
         │                                        │
         │ 7. loadState() detecta mudança        │
         │    isActive = false                   │
         │<───────────────────────────────────────│
         │                                        │
         │ 8. UI volta para tela inicial         │
         │    (WhitelistManager + TimerControl)  │
         │                                        │
```

### Gestão de Whitelist

```
┌─────────────────┐
│  Popup (React)  │
└────────┬────────┘
         │
         │ 1. Usuário adiciona/remove domínio
         │    (WhitelistManager component)
         │
         │ 2. handleWhitelistUpdate()
         │    chrome.storage.local.set({
         │        whitelist: newWhitelist
         │    })
         │
         │ 3. Estado local atualizado
         │    setWhitelist(newWhitelist)
         │
         │ Nota: Whitelist só é aplicada
         │ quando lockdown é iniciado
```

### Eventos Chrome Alarms

O Service Worker utiliza alarmes para verificações periódicas:

```typescript
// Verificação a cada minuto
chrome.alarms.create("checkTimer", { periodInMinutes: 1 });

// Alarme quando tempo expira
chrome.alarms.create("endLockdown", { when: endTime });

// Listener unificado
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkTimer") {
        checkTimer(); // Verifica se tempo expirou
    }
    if (alarm.name === "endLockdown") {
        stopLockdown(); // Desativa automaticamente
    }
});
```

### Bloqueio de Rede (declarativeNetRequest)

```typescript
// Regra dinâmica criada em startLockdown()
chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
        {
            id: 1,
            priority: 1,
            action: { type: "BLOCK" },
            condition: {
                urlFilter: "*",
                excludedInitiatorDomains: whitelist,
                resourceTypes: ["MAIN_FRAME"],
            },
        },
    ],
});

// Bloqueio é INSTANTÂNEO após regra ser aplicada
// Não depende do Popup estar aberto
```

### Características Importantes

1. **Persistência**: `chrome.storage.local` mantém estado entre fechamento/abertura do popup
2. **Autonomia**: Service Worker opera independentemente do popup
3. **Reatividade**: Popup atualiza UI a cada 1 segundo via polling
4. **Segurança**: UUID gerado no Service Worker, não no Popup
5. **Performance**: Bloqueio via `declarativeNetRequest` é nativo do Chrome (mais rápido)

## Estrutura

```
locked-in-extension/
├── dist/                 # Build final (criado pelo Vite)
├── public/
│   └── icons/           # Ícones da extensão
├── src/
│   ├── components/      # Componentes React
│   │   ├── WhitelistManager.tsx
│   │   ├── TimerControl.tsx
│   │   └── KillSwitch.tsx
│   ├── App.tsx          # Componente principal
│   ├── background.ts    # Service Worker
│   ├── main.tsx         # Entry point React
│   ├── types.ts         # TypeScript types
│   └── index.css        # Tailwind CSS
├── manifest.json        # Manifest V3
├── rules.json           # Regras de bloqueio
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Tecnologias

-   **Manifest V3**
-   **React 18**
-   **TypeScript**
-   **Tailwind CSS**
-   **Vite**
-   **chrome.declarativeNetRequest API**
-   **chrome.storage.local API**
