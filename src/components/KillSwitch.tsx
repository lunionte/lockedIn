import { useState, useEffect } from "react";

interface KillSwitchProps {
    remainingTime: number;
    uuid: string;
    onStop: () => void;
}

export default function KillSwitch({ remainingTime, uuid, onStop }: KillSwitchProps) {
    const [inputValue, setInputValue] = useState("");
    const [showUuid, setShowUuid] = useState(false);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Só permite digitar se o próximo caractere corresponde ao UUID
        if (value.length <= uuid.length) {
            const isValid = uuid.startsWith(value);
            if (isValid) {
                setInputValue(value);

                // Se completou o UUID, desativa o lockdown
                if (value === uuid) {
                    onStop();
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Modo Ativo</span>
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-1">{formatTime(remainingTime)}</div>
                <div className="text-sm text-gray-500">restantes</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm text-yellow-800 mb-2">
                    ⚠️ Para desativar o bloqueio, digite o código completo abaixo:
                </p>

                <button
                    onClick={() => setShowUuid(!showUuid)}
                    className="w-full px-3 py-2 mb-3 bg-white border border-gray-300 text-gray-900 text-left hover:bg-gray-50 transition-colors font-mono text-xs"
                >
                    {showUuid ? uuid : "••••••••-••••-••••-••••-••••••••••••"}
                </button>

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Digite o código aqui"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-900 font-mono text-sm mb-2"
                    autoComplete="off"
                    spellCheck="false"
                />

                <div className="text-xs text-gray-600">
                    Digitado: {inputValue.length} / {uuid.length}
                </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4">
                <p className="text-xs text-red-600">
                    Você está em modo Locked-In. Apenas os sites da whitelist estão acessíveis. Complete o código acima
                    para sair.
                </p>
            </div>
        </div>
    );
}
