import { useState, useEffect } from "react";

interface KillSwitchProps {
    remainingTime: number;
    uuid: string;
    onStop: () => void;
}

export default function KillSwitch({ remainingTime, uuid, onStop }: KillSwitchProps) {
    const [inputValue, setInputValue] = useState("");
    const [showUuid, setShowUuid] = useState(false);
    const [initialTime] = useState(remainingTime);

    useEffect(() => {
        setInputValue("");
    }, [uuid]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const getProgress = () => {
        if (initialTime === 0) return 0;
        return ((initialTime - remainingTime) / initialTime) * 100;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value.length <= uuid.length) {
            const isValid = uuid.startsWith(value);
            if (isValid) {
                setInputValue(value);

                if (value === uuid) {
                    onStop();
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Focus Mode Active</h1>
                <p className="text-sm text-gray-500">Stay focused on your allowed sites</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-700">Active Session</span>
                    </div>
                    <div className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
                        {Math.round(getProgress())}% elapsed
                    </div>
                </div>

                <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                        {formatTime(remainingTime)}
                    </div>
                    <div className="text-sm text-gray-600">remaining</div>
                </div>

                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-card">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Emergency Stop</h3>
                        <p className="text-xs text-gray-600">
                            To deactivate focus mode early, type the complete unlock code below
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowUuid(!showUuid)}
                    className="w-full px-4 py-3 mb-3 bg-gray-50 border border-gray-200 rounded text-left hover:bg-gray-100 transition-colors group"
                >
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-900">
                            {showUuid ? uuid : "••••••••-••••-••••-••••-••••••••••••"}
                        </span>
                        <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={
                                    showUuid
                                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                }
                            />
                        </svg>
                    </div>
                </button>

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type the unlock code"
                    className="w-full px-4 py-3 border border-gray-200 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all font-mono mb-3"
                    autoComplete="off"
                    spellCheck="false"
                />

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-400 transition-all duration-300"
                                style={{ width: `${(inputValue.length / uuid.length) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-gray-600 font-medium tabular-nums">
                            {inputValue.length}/{uuid.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <svg
                        className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <p className="text-xs text-amber-800 leading-relaxed">
                        You are in Locked-In Mode. Only whitelisted sites are accessible. Complete the unlock code above
                        to exit early.
                    </p>
                </div>
            </div>
        </div>
    );
}
