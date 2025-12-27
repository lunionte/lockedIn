import { useState } from "react";

interface WhitelistManagerProps {
    whitelist: string[];
    onUpdate: (whitelist: string[]) => void;
}

export default function WhitelistManager({ whitelist, onUpdate }: WhitelistManagerProps) {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (inputValue.trim()) {
            const newWhitelist = [...whitelist, inputValue.trim()];
            onUpdate(newWhitelist);
            setInputValue("");
        }
    };

    const handleRemove = (index: number) => {
        const newWhitelist = whitelist.filter((_, i) => i !== index);
        onUpdate(newWhitelist);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAdd();
        }
    };

    return (
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sites Permitidos</h2>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="exemplo.com"
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-900"
                />
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                    Adicionar
                </button>
            </div>

            <div className="space-y-2">
                {whitelist.map((site, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200"
                    >
                        <span className="text-sm text-gray-900">{site}</span>
                        <button
                            onClick={() => handleRemove(index)}
                            className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Remover
                        </button>
                    </div>
                ))}
                {whitelist.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum site na lista</p>
                )}
            </div>
        </div>
    );
}
