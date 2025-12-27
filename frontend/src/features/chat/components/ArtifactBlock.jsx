import React, { useState } from 'react';
import { LayoutTemplate, Copy, ChevronDown, ChevronUp, PenLine, Check } from 'lucide-react';

export function ArtifactBlock({ title, content, onEdit }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-6 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md group">
            <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer bg-white transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</span>
                        <span className="text-xs text-gray-400">Click to view content</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-600 text-[11px] font-medium transition-all border border-gray-100 flex items-center gap-1.5"
                        >
                            <PenLine className="w-3.5 h-3.5" />
                            Open Editor
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-all"
                        title="Copy content"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="p-2 text-gray-300 group-hover:text-gray-500 transition-colors">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-gray-100">
                    <div className="bg-[#fbfcff] p-5 overflow-x-auto max-h-[500px] font-mono text-[13px] leading-relaxed text-slate-700">
                        <pre>{content}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}
