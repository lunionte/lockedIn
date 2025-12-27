export interface StorageData {
    whitelist?: string[];
    isActive?: boolean;
    endTime?: number;
    killSwitchUuid?: string;
}

export interface Message {
    type: "START_LOCKDOWN" | "STOP_LOCKDOWN";
    endTime?: number;
    whitelist?: string[];
}
