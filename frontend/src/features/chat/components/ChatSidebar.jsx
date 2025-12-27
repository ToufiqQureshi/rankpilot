import { Plus, Trash2, ArrowLeftFromLine } from "lucide-react";

export function ChatSidebar({
    isOpen,
    setIsOpen,
    sessions,
    activeSessionId,
    onNewChat,
    onSwitchSession,
    onDeleteSession
}) {
    // If closed, we can either render nothing or animate width to 0.
    // For smoothness, we animate width.
    return (
        <div
            className={`
                h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
                ${isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'}
            `}
        >
            {isOpen && (
                <div className="w-72 flex flex-col h-full">
                    {/* Header: Title and New Chat */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <span className="text-sm font-bold text-gray-700">Chat History</span>

                        <div className="flex gap-1">
                            <button
                                onClick={onNewChat}
                                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                                title="New Chat"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                title="Close Sidebar"
                            >
                                <ArrowLeftFromLine className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Use different background for list area */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-white">
                        {sessions.map((session) => (
                            <button
                                key={session.session_id}
                                onClick={() => onSwitchSession(session.session_id)}
                                className={`w-full text-left px-3 py-3 rounded-xl text-[13px] leading-snug transition-all group flex items-start gap-3 border ${activeSessionId === session.session_id
                                    ? 'bg-blue-50 border-blue-100 text-blue-900 font-medium'
                                    : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-100'
                                    }`}
                            >
                                <span className="truncate flex-1 line-clamp-2">{session.title || "New Chat"}</span>

                                {activeSessionId === session.session_id && (
                                    <div className="flex items-center gap-1 flex-none">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.session_id); }}
                                            className="p-1 hover:bg-white text-blue-300 hover:text-red-500 rounded-md transition-colors"
                                            title="Delete Chat"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </button>
                        ))}

                        {sessions.length === 0 && (
                            <div className="text-center py-10 opacity-30 text-xs font-medium uppercase tracking-widest text-gray-400">
                                No Previous Chats
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
