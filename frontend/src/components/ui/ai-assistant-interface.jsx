
"use client"

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, MessageSquare, History, Settings, LogOut, PanelLeft, Share2, Mic2 } from "lucide-react";


// Feature Imports
import { useChat } from "../../features/chat/hooks/useChat";
import { ChatSidebar } from "../../features/chat/components/ChatSidebar";
import { ChatMessages } from "../../features/chat/components/ChatMessages";
import { ChatInput } from "../../features/chat/components/ChatInput";
import { EditorPanel } from "../../features/editor/EditorPanel";
import { CPanelManager } from "../../features/cpanel/CPanelManager";
import { SettingsModal } from "../../features/settings/SettingsModal";


export function AIAssistantInterface({ user, onLogout }) {
    // 1. Business Logic (Hook)
    const chat = useChat(user);

    // 2. UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isCPanelOpen, setIsCPanelOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Brand Voice State
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [voices, setVoices] = useState([]);

    // Fetch Voices on Mount
    useEffect(() => {
        if (!user?.email) return;
        fetch(`http://localhost:8000/api/brand-voices/${user.email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setVoices(data.voices);
            })
            .catch(err => console.error("Voice fetch error:", err));
    }, [user]);

    // 3. Handlers
    const handleEdit = (msg) => setEditingMessage(msg);
    const handleCloseEditor = () => setEditingMessage(null);

    const handleSaveEditor = (newContent) => {
        if (editingMessage) {
            chat.editMessage(editingMessage.id, newContent);
            setEditingMessage(null);
        }
    };

    const handleSendMessage = (payload) => {
        // Pass selected voice ID to the hook
        chat.sendMessage(payload.input, payload.attachments, selectedVoice?.id);
    };

    // Find current session title
    const currentSession = chat.sessionsList.find(s => s.session_id === chat.sessionId);
    const chatTitle = currentSession?.title || "Greeting";

    return (
        <div className="flex h-full bg-[#f9f9f9] text-gray-900 font-sans overflow-hidden relative selection:bg-orange-100 selection:text-orange-900">

            {/* CPANEL MODAL */}
            <CPanelManager
                isOpen={isCPanelOpen}
                onClose={() => setIsCPanelOpen(false)}
            />

            {/* LEFT: Minimalist Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                sessions={chat.sessionsList}
                activeSessionId={chat.sessionId}
                onNewChat={() => {
                    chat.createNewChat();
                }}
                onSwitchSession={(id) => {
                    chat.switchSession(id);
                }}
                onDeleteSession={chat.deleteSession}
                onLogout={onLogout}
                onOpenEditor={() => setEditingMessage({ id: 'standalone', answer: { content: "" } })}
                onOpenCPanel={() => setIsCPanelOpen(true)}
            />

            {/* SPLIT CONTAINER */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">

                {/* Header (Minimalist) */}
                <header className="h-16 flex-none border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            title={isSidebarOpen ? "Close History" : "Open History"}
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>

                        <div className="h-6 w-[1px] bg-gray-200 mx-1" />

                        <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 group"
                        >
                            <span className="truncate max-w-[150px]">{chatTitle}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </button>

                        {/* Brand Voice Selector */}
                        <div className="relative group/voice">
                            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedVoice ? 'bg-indigo-100 text-indigo-700' : 'bg-white hover:bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                <Mic2 className="w-4 h-4" />
                                <span className="max-w-[100px] truncate">{selectedVoice ? selectedVoice.name : "Default Voice"}</span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1 hidden group-hover/voice:block z-50">
                                <button
                                    onClick={() => setSelectedVoice(null)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                    Default Voice
                                </button>
                                {voices.map(voice => (
                                    <button
                                        key={voice.id}
                                        onClick={() => setSelectedVoice(voice)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg truncate"
                                    >
                                        {voice.name}
                                    </button>
                                ))}
                                <div className="h-[1px] bg-gray-100 my-1" />
                                <a href="/brand-voice" className="block w-full text-left px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    + Manage Voices
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Share button removed */}
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden relative">

                    {/* CENTER: Chat Interface */}
                    <div className={`flex flex-col h-full relative transition-all duration-500 ease-in-out ${editingMessage ? 'w-[45%] border-r border-gray-100' : 'w-full'}`}>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto w-full relative scroll-smooth">
                            <div className="max-w-3xl mx-auto w-full">
                                <ChatMessages
                                    messages={chat.messages}
                                    onEdit={handleEdit}
                                />
                                <div ref={chat.messagesEndRef} className="h-32" />
                            </div>
                        </div>

                        {/* Input Area (Centered & Floating) */}
                        <div className="flex-none p-6 relative">
                            <div className="max-w-3xl mx-auto w-full">
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    messages={chat.messages}
                                    attachments={attachments}
                                    setAttachments={setAttachments}
                                    onStopGenerating={chat.stopGenerating}
                                    isGenerating={chat.messages.some(m => m.isLoading)}
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        NeuroFiq is AI and can make mistakes. Please double-check responses.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Editor Panel */}
                    {editingMessage && (
                        <div className="w-[55%] h-full bg-[#fcfcfc] animate-in slide-in-from-right-10 overflow-hidden relative z-40 border-l border-gray-100 shadow-2xl">
                            <EditorPanel
                                isOpen={true}
                                initialContent={editingMessage.answer?.content || ""}
                                onClose={handleCloseEditor}
                                onSave={handleSaveEditor}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
