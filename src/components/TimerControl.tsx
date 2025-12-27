import { useState } from "react";

interface TimerControlProps {
    onStart: (minutes: number) => void;
}

export default function TimerControl({ onStart }: TimerControlProps) {
    const [customMinutes, setCustomMinutes] = useState("");
    const presetMinutes = [
        { value: 15, label: "15 min" },
        { value: 30, label: "30 min" },
        { value: 60, label: "1 hour" },
        { value: 120, label: "2 hours" },
    ];

    const handleStart = (minutes: number) => {
        if (minutes > 0) {
            onStart(minutes);
        }
    };

    const handleCustomStart = () => {
        const minutes = parseInt(customMinutes);
        if (minutes > 0) {
            handleStart(minutes);
            setCustomMinutes("");
        }
    };

    return (
        <div>
            <div className="mb-4 text-center">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Focus Timer</h2>
                <p className="text-xs text-gray-500">Set duration for focus mode</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                {presetMinutes.map((preset) => (
                    <button
                        key={preset.value}
                        onClick={() => handleStart(preset.value)}
                        className="group relative px-4 py-4 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md hover:border-emerald-400 transition-all"
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 mb-2 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                                <svg
                                    className="w-5 h-5 text-gray-600 group-hover:text-emerald-500 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{preset.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-gray-50 rounded-md p-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">Custom Duration</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        placeholder="Minutes"
                        min="1"
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    />
                    <button
                        onClick={handleCustomStart}
                        className="px-4 py-2 bg-emerald-400 text-white text-sm font-medium rounded hover:bg-emerald-500 transition-colors whitespace-nowrap"
                    >
                        Start Focus
                    </button>
                </div>
            </div>
        </div>
    );
}
