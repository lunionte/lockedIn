import { useState } from "react";
import { expandDomain } from "../domainAliases";

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

    const getFavicon = (domain: string) => {
        const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`;
    };

    const getAliasesInfo = (domain: string) => {
        const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const aliases = expandDomain(cleanDomain);
        // Retorna aliases diferentes do domínio original
        const otherAliases = aliases.filter((alias) => alias !== cleanDomain);
        return otherAliases.length > 0 ? otherAliases : null;
    };

    return (
        <div>
            <div className="mb-4 text-center">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Allowed Sites</h2>
                <p className="text-xs text-gray-500">Sites accessible during focus mode</p>
            </div>

            <div className="bg-gray-50 rounded-md p-3 mb-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="example.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <button
                    onClick={handleAdd}
                    className="w-full mt-2 px-4 py-2 bg-emerald-400 text-white text-sm font-medium rounded hover:bg-emerald-500 transition-colors"
                >
                    Add Site
                </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {whitelist.map((site, index) => {
                    const aliases = getAliasesInfo(site);
                    return (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between px-3 py-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <img
                                        src={getFavicon(site)}
                                        alt=""
                                        className="w-6 h-6 rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTYgOEMxMS41ODE3IDggOCA5LjM0MzE1IDggMTFWMjFDOCAyMi42NTY5IDExLjU4MTcgMjQgMTYgMjRDMjAuNDE4MyAyNCAyNCAyMi42NTY5IDI0IDIxVjExQzI0IDkuMzQzMTUgMjAuNDE4MyA4IDE2IDhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==";
                                        }}
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900">{site}</span>
                                        {aliases && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <svg
                                                    className="w-3 h-3 text-emerald-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                                <span className="text-xs text-emerald-600 font-medium">
                                                    +{aliases.length} alias{aliases.length > 1 ? "es" : ""}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({aliases.slice(0, 2).join(", ")}
                                                    {aliases.length > 2 && `, +${aliases.length - 2}`})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
                {whitelist.length === 0 && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                            <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">No allowed sites yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add sites to access during focus mode</p>
                    </div>
                )}
            </div>
        </div>
    );
}
