import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Edit2, FileText, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { SearchResults } from "../../../components/chat/SearchResults";
import { Logo } from "../../../components/ui/Logo";


export function ChatMessages({ messages, onEdit }) {
    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-12 h-12 text-[#d16b47]">
                    <Logo />
                </div>
                <h2 className="text-2xl font-serif text-gray-800 italic">How can I help you today?</h2>
            </div>
        );
    }

    // Helper to separate text and artifacts
    const renderContentWithArtifacts = (content) => {
        if (!content) return null;

        // Regex to find <artifact title="...">...</artifact> OR raw HTML starting with <!DOCTYPE html> or <html
        // Using 's' flag equivalent logic via [\s\S] for multiline support
        const artifactRegex = /(<artifact\s+title="([^"]+)">([\s\S]*?)<\/artifact>)|(<!DOCTYPE html>[\s\S]*?<\/html>)|(<html[\s\S]*?<\/html>)/g;

        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = artifactRegex.exec(content)) !== null) {
            // Text before artifact
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.substring(lastIndex, match.index)
                });
            }

            // Determine if it's a formal artifact or raw HTML
            const isFormalArtifact = !!match[1];
            const title = isFormalArtifact ? match[2] : "Generated HTML Content";
            const artifactContent = isFormalArtifact ? match[3] : match[0];

            // Artifact
            parts.push({
                type: 'artifact',
                title: title,
                content: artifactContent
            });

            lastIndex = match.index + match[0].length;
        }

        // Remaining text
        if (lastIndex < content.length) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex)
            });
        }

        if (parts.length === 0) {
            return (
                <div className="text-[16px] text-gray-800 leading-[1.8] font-serif pr-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
            );
        }

        return parts.map((part, index) => {
            if (part.type === 'artifact') {
                return (
                    <div key={index} className="my-6 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 font-sans flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                {part.title}
                            </span>
                            <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-white border border-gray-200 rounded">HTML Artifact</span>
                        </div>
                        <div className="p-0">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({ node, inline, className, children, ...props }) => {
                                        return (
                                            <div className="bg-[#fbfcff] p-4 overflow-x-auto font-mono text-[13px] text-slate-700 leading-relaxed">
                                                <code className={className} {...props}>{children}</code>
                                            </div>
                                        );
                                    }
                                }}
                            >
                                {`\`\`\`html\n${part.content}\n\`\`\``}
                            </ReactMarkdown>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div key={index} className="text-[16px] text-gray-800 leading-[1.8] font-serif pr-10">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-6">{children}</p>,
                                code: ({ node, inline, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className="bg-[#f9f9f9] border border-gray-100 p-4 rounded-xl overflow-x-auto my-6 font-mono text-sm text-gray-700">
                                            <code className={className} {...props}>{children}</code>
                                        </div>
                                    ) : (
                                        <code className="bg-gray-100 px-1 rounded text-orange-700 font-mono text-sm" {...props}>{children}</code>
                                    );
                                },
                                li: ({ children }) => <li className="mb-2 ml-4 list-disc">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>
                            }}
                        >
                            {part.content}
                        </ReactMarkdown>
                    </div>
                );
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-12">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in duration-500`}>

                    {msg.role === 'user' ? (
                        <div className="max-w-[80%] bg-[#f4f4f4] text-gray-800 px-5 py-3 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                    {msg.attachments.map((file, i) => (
                                        <div key={i} className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                                            <FileText className="w-3 h-3" />
                                            {file.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full space-y-4">
                            {/* AI Icon */}
                            <div className="w-8 h-8 text-[#d16b47] mb-2">
                                <Logo />
                            </div>

                            {/* Research Results (New Smooth UI) */}
                            {(msg.research?.hasSearched || msg.research?.isSearching) && (
                                <div className="mb-6 -ml-2">
                                    <SearchResults
                                        isSearching={msg.research.isSearching}
                                        results={msg.research.sources}
                                    />
                                </div>
                            )}

                            {/* Content or Loading */}
                            {(msg.answer && msg.answer.content) ? (
                                <div>
                                    {renderContentWithArtifacts(msg.answer.content)}

                                    {/* Minimalist Action Icons */}
                                    {!msg.isLoading && (
                                        <div className="flex items-center gap-4 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Copy">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onEdit(msg)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                msg.isLoading && !msg.research?.isSearching && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                        <span className="text-xs text-gray-400 font-medium italic">Thinking...</span>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
