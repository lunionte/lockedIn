import { v4 as uuidv4 } from "uuid";
import { Message, StorageData } from "./types";

// Gerenciamento do estado do lockdown
chrome.runtime.onMessage.addListener((message: Message) => {
    if (message.type === "START_LOCKDOWN") {
        startLockdown(message.endTime!, message.whitelist!);
    } else if (message.type === "STOP_LOCKDOWN") {
        stopLockdown();
    }
});

// Verifica o timer a cada minuto
chrome.alarms.create("checkTimer", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkTimer") {
        checkTimer();
    }
});

async function startLockdown(endTime: number, whitelist: string[]) {
    const uuid = uuidv4();

    await chrome.storage.local.set({
        isActive: true,
        endTime: endTime,
        whitelist: whitelist,
        killSwitchUuid: uuid,
    });

    await updateBlockingRules(whitelist);

    // Define alarme para quando o tempo acabar
    chrome.alarms.create("endLockdown", { when: endTime });
}

async function stopLockdown() {
    await chrome.storage.local.set({
        isActive: false,
        endTime: null,
        killSwitchUuid: "",
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
    });

    chrome.alarms.clear("endLockdown");
}

async function checkTimer() {
    const result = await chrome.storage.local.get(["isActive", "endTime"]);
    const data = result as StorageData;

    if (data.isActive && data.endTime && Date.now() >= data.endTime) {
        await stopLockdown();
    }
}

async function updateBlockingRules(whitelist: string[]) {
    // Remove regras antigas
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
    });

    if (whitelist.length === 0) {
        // Se não há whitelist, bloqueia tudo
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
                    condition: {
                        urlFilter: "*",
                        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
                    },
                },
            ],
        });
    } else {
        // Cria padrões de exclusão para a whitelist
        const excludedDomains = whitelist.map((domain) => {
            // Remove protocolo e barras
            return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        });

        // Bloqueia tudo exceto os domínios da whitelist
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
                    condition: {
                        urlFilter: "*",
                        excludedInitiatorDomains: excludedDomains,
                        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
                    },
                },
            ],
        });
    }
}

// Listener para quando o timer acabar
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "endLockdown") {
        stopLockdown();
    }
});

// Inicialização
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        isActive: false,
        whitelist: [],
        endTime: null,
        killSwitchUuid: "",
    });
});
