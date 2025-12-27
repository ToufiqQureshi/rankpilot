import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../../../lib/api';

export const useChat = (user) => {
    const navigate = useNavigate();
    const { chatId } = useParams(); // Get from URL

    const [messages, setMessages] = useState([]);
    const [sessionsList, setSessionsList] = useState([]);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const creatingChatId = useRef(null); // Ref to track if we just created this chat

    // --- Helper: Scroll to bottom ---
    const scrollToBottom = useCallback((instant = false) => {
        const behavior = instant ? "auto" : "smooth";
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // Smart Scroll Effect
    useEffect(() => {
        // Only scroll if we are already near the bottom or if it's a new message from USER
        // For now, let's keep it simple: strict scrolling only on new user messages or initial load
        // But for streaming, we want to scroll IF the user hasn't scrolled up.

        const container = messagesEndRef.current?.parentElement?.parentElement;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isNearBottom) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    // --- 1. Load Sessions ---
    const loadSessions = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(API_ENDPOINTS.SESSIONS(user.email));
            const data = await res.json();
            if (data.sessions) setSessionsList(data.sessions);
        } catch (err) {
            console.error("Failed to load sessions:", err);
        }
    }, [user?.email]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // --- 2. Load History based on URL ---
    useEffect(() => {
        if (!chatId) {
            setMessages([]); // New Chat
            return;
        }

        // If we just created this chat, don't fetch history immediately (preserves optimistic state)
        if (creatingChatId.current === chatId) {
            creatingChatId.current = null;
            return;
        }

        const fetchHistory = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.HISTORY(chatId));
                const data = await res.json();
                if (data.history) {
                    const formatted = data.history.map(msg => ({
                        ...msg,
                        answer: msg.role === 'assistant' ? { content: msg.content } : null,
                        research: msg.role === 'assistant' ? { hasSearched: msg.meta?.hasSearched } : null
                    }));
                    setMessages(formatted);
                }
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };

        fetchHistory();
    }, [chatId]);

    // --- 3. Switch Session (Navigation) ---
    const switchSession = useCallback((id) => {
        navigate(`/chat/${id}`);
    }, [navigate]);

    const createNewChat = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // --- 4. Send Message ---
    const sendMessage = useCallback(async (input, attachments = []) => {
        if (!input.trim() && attachments.length === 0) return;

        let activeChatId = chatId;

        // If on homepage, generate ID and redirect slightly/optimistically
        // Ideally we redirect AFTER creation to define URL, 
        // OR we generate ID on frontend and redirect immediately.
        // Let's generate ID and navigate to it to start the chat context.
        if (!activeChatId) {
            activeChatId = crypto.randomUUID();
            creatingChatId.current = activeChatId; // Mark as just created
            // We should navigate silently or handle the route change.
            // PRO TIP: Navigate to the new chat URL immediately so persistence works there.
            navigate(`/chat/${activeChatId}`, { replace: true });
        }

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            attachments: attachments
        };

        const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            answer: { content: '' },
            research: { hasSearched: false, isSearching: false, sources: [] },
            isLoading: true
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);

        try {
            abortControllerRef.current = new AbortController();
            const response = await fetch(API_ENDPOINTS.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    session_id: activeChatId,
                    user_id: user.email,
                    attachments: attachments.map(a => ({ name: a.name, type: a.type }))
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        setMessages(prev => {
                            const newMsgs = [...prev];
                            const lastIndex = newMsgs.length - 1;
                            const last = { ...newMsgs[lastIndex] };

                            if (data.type === 'content') {
                                const currentContent = last.content || "";
                                const updatedContent = currentContent + data.content;
                                last.content = updatedContent;
                                last.answer = { ...last.answer, content: updatedContent };
                            } else if (data.type === 'tool_start') {
                                last.research = { ...last.research, hasSearched: true, isSearching: true };
                            } else if (data.type === 'tool_end') {
                                last.research = { ...last.research, isSearching: false, sources: data.sources || [] };
                            }
                            // Note: Titles might be generated asynchronous

                            newMsgs[lastIndex] = last;
                            return newMsgs;
                        });

                        // If title generated, reload sidebar
                        if (data.type === 'title') loadSessions();

                    } catch (e) {
                        console.error("Error parsing stream:", e);
                    }
                }
            }
            // Reload sessions after chat to show new title/session in sidebar
            await loadSessions();

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Chat Error:", err);
                // Error handling logic
            }
        } finally {
            setMessages(prev => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0) {
                    newMsgs[newMsgs.length - 1].isLoading = false;
                }
                return newMsgs;
            });
            abortControllerRef.current = null;
        }
    }, [chatId, user?.email, navigate, loadSessions]);

    // --- 5. Delete ---
    const deleteSession = useCallback(async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/sessions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadSessions();
                if (chatId === id) navigate('/');
            }
        } catch (error) {
            console.error(error);
        }
    }, [chatId, loadSessions, navigate]);

    const stopGenerating = useCallback(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    }, []);

    const editMessage = useCallback((id, newContent) => {
        // Placeholder
        setMessages(prev => prev.map(m => m.id === id ? { ...m, answer: { content: newContent } } : m));
    }, []);

    return {
        messages,
        sessionId: chatId, // Expose chatId as sessionId
        sessionsList,
        messagesEndRef,
        sendMessage,
        switchSession,
        createNewChat,
        deleteSession,
        stopGenerating,
        editMessage
    };
};
