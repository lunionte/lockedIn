import { useState } from "react";

interface TimerControlProps {
    onStart: (minutes: number) => void;
}

export default function TimerControl({ onStart }: TimerControlProps) {
    const [customMinutes, setCustomMinutes] = useState("");
    const presetMinutes = [15, 30, 60, 120];

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
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Temporizador de Foco</h2>

            <div className="grid grid-cols-2 gap-2 mb-4">
                {presetMinutes.map((minutes) => (
                    <button
                        key={minutes}
                        onClick={() => handleStart(minutes)}
                        className="px-4 py-3 bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors font-medium"
                    >
                        {minutes} min
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Minutos personalizados"
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-900"
                />
                <button
                    onClick={handleCustomStart}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                    Iniciar
                </button>
            </div>
        </div>
    );
}
