import React, { useState, useEffect, useRef } from "react";
import {
    Loader2,
    Globe,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Sparkles
} from "lucide-react";

export function SearchResults({ isSearching = false, results = [] }) {
    const [isOpen, setIsOpen] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    // ⏱️ Safe timer
    useEffect(() => {
        if (isSearching) {
            timerRef.current = setInterval(() => {
                setElapsed((prev) => +(prev + 0.1).toFixed(1));
            }, 100);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isSearching]);

    // ❌ Nothing to show
    if (!isSearching && results.length === 0) return null;

    // 🌐 Safe hostname parser
    const getHostname = (url) => {
        try {
            return new URL(url).hostname;
        } catch {
            return "unknown source";
        }
    };

    return (
        <div className="font-sans my-4 max-w-xl">
            <div
                className={`border rounded-2xl overflow-hidden transition-all duration-300
        ${isSearching ? "border-orange-200 bg-orange-50/30" : "border-gray-200 bg-white"}`}
            >
                {/* HEADER */}
                <button
                    onClick={() => setIsOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 text-left"
                >
                    <div className="flex items-center gap-3">
                        {isSearching ? (
                            <div className="relative">
                                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                <Sparkles className="w-3 h-3 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                        ) : (
                            <div className="bg-green-100 p-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                        )}

                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                                {isSearching ? "Researching..." : "Research Complete"}
                            </span>
                            {isSearching && (
                                <span className="text-[10px] text-orange-600/70 uppercase tracking-wider">
                                    {elapsed}s elapsed
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isSearching && results.length > 0 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[11px] font-bold border">
                                {results.length} Sources
                            </span>
                        )}
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                </button>

                {/* CONTENT */}
                {isOpen && (
                    <div className="max-h-64 overflow-y-auto px-2 pb-2">
                        <div className="bg-white/50 rounded-xl p-1 space-y-1">
                            {results.map((result, idx) => (
                                <a
                                    key={result.url || idx}
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {result.title || "Untitled Source"}
                                        </div>
                                        <div className="text-[11px] text-gray-400 truncate">
                                            {getHostname(result.url)}
                                        </div>
                                    </div>
                                </a>
                            ))}

                            {isSearching && results.length === 0 && (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-gray-400 animate-pulse">
                                        Scanning knowledge base…
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
