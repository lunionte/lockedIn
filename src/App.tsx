import { useState, useEffect } from "react";
import WhitelistManager from "./components/WhitelistManager";
import TimerControl from "./components/TimerControl";
import KillSwitch from "./components/KillSwitch";
import { StorageData } from "./types";

function App() {
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [killSwitchUuid, setKillSwitchUuid] = useState("");

    useEffect(() => {
        loadState();

        const interval = setInterval(() => {
            loadState();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadState = async () => {
        const result = await chrome.storage.local.get(["whitelist", "isActive", "endTime", "killSwitchUuid"]);
        const data = result as StorageData;

        setWhitelist(data.whitelist || []);
        setIsActive(data.isActive || false);
        setKillSwitchUuid(data.killSwitchUuid || "");

        if (data.isActive && data.endTime) {
            const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
            setRemainingTime(remaining);
        } else {
            setRemainingTime(0);
        }
    };

    const handleWhitelistUpdate = async (newWhitelist: string[]) => {
        await chrome.storage.local.set({ whitelist: newWhitelist });
        setWhitelist(newWhitelist);
    };

    const handleStartTimer = async (minutes: number) => {
        const endTime = Date.now() + minutes * 60 * 1000;
        await chrome.runtime.sendMessage({
            type: "START_LOCKDOWN",
            endTime,
            whitelist,
        });
    };

    const handleKillSwitch = async () => {
        await chrome.runtime.sendMessage({ type: "STOP_LOCKDOWN" });
        setIsActive(false);
        setRemainingTime(0);
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <div className="p-6">
                {!isActive ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Locked-In Mode</h1>
                            <p className="text-sm text-gray-500">Focus on what matters most</p>
                        </div>
                        <WhitelistManager whitelist={whitelist} onUpdate={handleWhitelistUpdate} />
                        <div className="h-px bg-gray-200 my-6"></div>
                        <TimerControl onStart={handleStartTimer} />
                    </>
                ) : (
                    <KillSwitch remainingTime={remainingTime} uuid={killSwitchUuid} onStop={handleKillSwitch} />
                )}
            </div>
        </div>
    );
}

export default App;
