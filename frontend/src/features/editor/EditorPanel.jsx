import React, { useState, useEffect, useMemo } from "react";
import { X, Save, Copy, Eye, PenLine, FileText, Code, ChevronDown, Check, Globe, BarChart2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import { SeoSidebar } from "./components/SeoSidebar";

export function EditorPanel({ isOpen, initialContent, onClose, onSave }) {
    const [content, setContent] = useState("");
    const [activeTab, setActiveTab] = useState("preview"); // 'write' | 'preview' | 'code'
    const [isCopied, setIsCopied] = useState(false);
    const [showSeo, setShowSeo] = useState(true);
    const [isTransforming, setIsTransforming] = useState(false);
    const textareaRef = React.useRef(null);

    const handleAIAction = async (action) => {
        if (!content) return;
        setIsTransforming(true);

        // Get selection or full text
        const textarea = textareaRef.current;
        const start = textarea ? textarea.selectionStart : 0;
        const end = textarea ? textarea.selectionEnd : 0;
        const hasSelection = start !== end;
        const textToTransform = hasSelection ? content.substring(start, end) : content;

        try {
            const res = await fetch('http://localhost:8000/api/editor/transform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToTransform,
                    action: action
                })
            });
            const data = await res.json();

            if (data.success) {
                const newText = data.result;
                if (hasSelection) {
                    const before = content.substring(0, start);
                    const after = content.substring(end);
                    setContent(before + newText + after);
                } else {
                    setContent(newText);
                }
            } else {
                alert("AI Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to transform text");
        } finally {
            setIsTransforming(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent || "");
            // Default to preview when opening from chat
            setActiveTab("preview");
        }
    }, [isOpen, initialContent]);

    // Generate Full HTML Template
    const fullHtml = useMemo(() => {
        if (!content) return "";
        const bodyContent = marked.parse(content);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Content</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            background-color: #f9fafb; 
        }
        article { 
            background: white; 
            padding: 60px; 
            border-radius: 16px; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); 
            border: 1px solid #f3f4f6;
        }
        h1 { color: #111827; font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; border-bottom: 2px solid #eff6ff; padding-bottom: 1rem; }
        h2 { color: #1f2937; font-size: 1.75rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.25rem; }
        h3 { color: #374151; font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; }
        p { margin-bottom: 1.5rem; }
        ul, ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        li { margin-bottom: 0.75rem; }
        a { color: #2563eb; text-decoration: none; border-bottom: 1px solid transparent; transition: border 0.2s; }
        a:hover { border-bottom-color: #2563eb; }
        blockquote { border-left: 4px solid #e5e7eb; padding-left: 1.5rem; font-style: italic; color: #4b5563; margin: 2rem 0; }
        code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 6px; font-size: 0.875em; color: #db2777; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        pre { background: #111827; color: #f9fafb; padding: 1.5rem; border-radius: 12px; overflow-x: auto; margin: 1.5rem 0; }
        pre code { background: transparent; padding: 0; color: inherit; font-size: 0.9em; }
        img { max-width: 100%; border-radius: 12px; margin: 2rem 0; }
        hr { border: 0; border-top: 1px solid #e5e7eb; margin: 3rem 0; }
    </style>
</head>
<body>
    <article>
        ${bodyContent}
    </article>
</body>
</html>`;
    }, [content]);

    const handleCopy = (type) => {
        const textToCopy = type === 'html' ? fullHtml : content;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB] border-l border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Professional Header (Claude-style) */}
            <div className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-none z-10 shadow-sm">
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                    <button
                        onClick={() => setActiveTab("preview")}
                        title="View Preview"
                        className={`p-2 rounded-lg transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setActiveTab("code")}
                        title="View HTML Code"
                        className={`p-2 rounded-lg transition-all ${activeTab === 'code' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Code className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                    <button
                        onClick={() => setActiveTab("write")}
                        title="Edit Markdown"
                        className={`p-2 rounded-lg transition-all ${activeTab === 'write' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <PenLine className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">

                    <button
                        onClick={() => setShowSeo(!showSeo)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2
                            ${showSeo
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        SEO
                    </button>

                    <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                        <button
                            onClick={() => handleCopy(activeTab === 'code' ? 'html' : 'md')}
                            className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors border-r border-gray-100"
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {activeTab === 'code' ? 'Copy HTML' : 'Copy'}
                        </button>
                        <button className="px-2 py-1.5 hover:bg-gray-50 transition-colors">
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => onSave(content)}
                        className="h-9 px-5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-[13px] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        Publish
                    </Button>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area + Sidebar Container */}
            <div className="flex-1 overflow-hidden flex relative">

                {/* Main Editor */}
                <div className="flex-1 bg-[#F3F4F6] p-4 md:p-6 lg:p-8 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">

                        {/* Status Bar */}
                        <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${activeTab === 'write' ? 'bg-amber-400' : 'bg-green-400'}`} />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    {activeTab === 'write' ? 'Draft Mode' : activeTab === 'code' ? 'HTML Export' : 'Live Preview'}
                                </span>
                            </div>
                            <div className="text-[11px] font-medium text-gray-400">
                                {content.length} chars • {content.split(/\s+/).filter(Boolean).length} words
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'write' ? (
                                <div className="h-full flex flex-col">
                                    {/* Toolbar */}
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
                                        <div className="flex items-center gap-1 border-r border-gray-100 pr-2 mr-2">
                                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Bold"><strong>B</strong></button>
                                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded italic" title="Italic"><em>I</em></button>
                                        </div>

                                        {/* AI Actions */}
                                        <span className="text-xs font-semibold text-indigo-500 mr-1">AI:</span>
                                        <button
                                            onClick={() => handleAIAction('rewrite')}
                                            disabled={isTransforming}
                                            className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            {isTransforming ? '...' : '✨ Rewrite'}
                                        </button>
                                        <button
                                            onClick={() => handleAIAction('shorten')}
                                            disabled={isTransforming}
                                            className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            {isTransforming ? '...' : '✂️ Shorten'}
                                        </button>
                                        <button
                                            onClick={() => handleAIAction('expand')}
                                            disabled={isTransforming}
                                            className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            {isTransforming ? '...' : '➕ Expand'}
                                        </button>
                                    </div>

                                    <textarea
                                        ref={textareaRef}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full flex-1 p-8 md:p-12 resize-none outline-none text-[#1F2937] text-[16px] leading-[1.8] font-sans placeholder:text-gray-300 bg-transparent selection:bg-blue-100 selection:text-blue-900"
                                        placeholder="Write your content here..."
                                        spellCheck="false"
                                    />
                                </div>
                            ) : activeTab === 'preview' ? (
                                <div className="p-8 md:p-16 lg:p-20 prose prose-slate max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ ...props }) => <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b-2 border-slate-100 pb-4" {...props} />,
                                            h2: ({ ...props }) => <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6" {...props} />,
                                            p: ({ ...props }) => <p className="text-lg leading-relaxed text-slate-700 mb-6" {...props} />,
                                            ul: ({ ...props }) => <ul className="space-y-3 mb-8 list-disc pl-5 text-slate-700" {...props} />,
                                            li: ({ ...props }) => <li className="text-lg" {...props} />,
                                            code: ({ node, inline, className, children, ...props }) => (
                                                inline
                                                    ? <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono" {...props}>{children}</code>
                                                    : <pre className="bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto my-8 border border-slate-800 shadow-inner" {...props}><code>{children}</code></pre>
                                            )
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 p-0 m-0 overflow-hidden font-mono text-[13px]">
                                        <textarea
                                            readOnly
                                            value={fullHtml}
                                            className="w-full h-full p-8 md:p-12 resize-none outline-none text-[#EE6723] bg-[#FDFDFD] leading-[1.6]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEO Sidebar */}
                {showSeo && <SeoSidebar content={content} />}

            </div>
        </div>
    );
}
