"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Plus, Square, X, History, ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Textarea } from "../../../components/ui/textarea";

// 1. Suggested Actions Component
const SuggestedActions = React.memo(({ submitMessage }) => {
    const suggestedActions = [
        { title: "What are some tips", label: "for staying motivated?", action: "What are some tips for staying motivated?" },
        { title: "Suggest ideas for", label: "a creative writing project", action: "Suggest ideas for a creative writing project" },
        { title: "How can I improve", label: "my time management skills?", action: "How can I improve my time management skills?" },
        { title: "Help me brainstorm", label: "ideas for a new hobby", action: "Help me brainstorm ideas for a new hobby" },
    ];

    return (
        <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {suggestedActions.map((suggestedAction, index) => (
                <button
                    key={index}
                    onClick={() => submitMessage(suggestedAction.action, [])}
                    className="text-left border border-gray-100 bg-white rounded-2xl px-5 py-4 text-sm hover:bg-gray-50 transition-all hover:border-gray-200 shadow-sm group"
                >
                    <span className="font-semibold text-gray-800 block mb-1 group-hover:text-gray-900">{suggestedAction.title}</span>
                    <span className="text-gray-400 block text-xs">{suggestedAction.label}</span>
                </button>
            ))}
        </div>
    );
});

// 2. Attachment Preview Component
function PreviewAttachment({ attachment, isUploading, onRemove }) {
    const { name, url } = attachment;
    return (
        <div className="flex flex-col gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl relative group w-20 h-20 justify-center items-center shadow-sm">
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gray-400 text-[10px] font-bold border border-gray-100 uppercase">
                {name.split('.').pop()}
            </div>
            <div className="text-[10px] text-gray-500 w-full truncate text-center px-1" title={name}>
                {name}
            </div>
            {isUploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                    <div className="animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full" />
                </div>
            )}
            <button
                type="button"
                onClick={onRemove}
                className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
                <X className="w-2.5 h-2.5 text-gray-500" />
            </button>
        </div>
    );
}

// 3. Send/Stop Button
const SendButton = React.memo(({ submitMessage, chatInput, currentAttachments, isGenerating, stopGenerating }) => {
    if (isGenerating) {
        return (
            <button
                onClick={stopGenerating}
                className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-black transition-all shadow-md active:scale-95"
            >
                <Square className="w-4 h-4 fill-current" />
            </button>
        );
    }
    const isDisabled = !chatInput.trim() && currentAttachments.length === 0;
    return (
        <button
            onClick={() => submitMessage(chatInput, currentAttachments)}
            disabled={isDisabled}
            className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-md active:scale-95",
                isDisabled ? "bg-gray-100 text-gray-300 shadow-none cursor-not-allowed" : "bg-gray-900 text-white hover:bg-black"
            )}
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
});

// MAIN INPUT COMPONENT
export function ChatInput({
    messages = [],
    attachments = [],
    setAttachments = () => { },
    onSendMessage,
    onStopGenerating = () => { },
    isGenerating,
    className,
}) {
    const [chatInput, setChatInput] = useState("");
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadQueue, setUploadQueue] = useState([]);

    const submitMessage = useCallback((text, currentAtts) => {
        if ((!text.trim() && currentAtts.length === 0) || isSubmitting || isGenerating) return;
        setIsSubmitting(true);
        onSendMessage({ input: text, attachments: currentAtts });
        setChatInput("");
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setIsSubmitting(false), 500);
    }, [onSendMessage, setAttachments, isSubmitting, isGenerating]);

    const handleFileChange = useCallback(async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        const newFileItems = files.map(file => ({ id: crypto.randomUUID(), file }));
        setUploadQueue(prev => [...prev, ...newFileItems.map(i => i.id)]);
        for (const item of newFileItems) {
            await new Promise(r => setTimeout(r, 400));
            const newAtt = {
                id: item.id,
                name: item.file.name,
                url: URL.createObjectURL(item.file),
                type: item.file.type.startsWith('image') ? 'image' : 'file',
                contentType: item.file.type
            };
            setAttachments(prev => [...prev, newAtt]);
            setUploadQueue(prev => prev.filter(id => id !== item.id));
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [setAttachments]);

    const handleRemoveAttachment = useCallback((index) => {
        setAttachments(prev => {
            const att = prev[index];
            if (att?.url) URL.revokeObjectURL(att.url);
            return prev.filter((_, i) => i !== index);
        });
    }, [setAttachments]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitMessage(chatInput, attachments);
        }
    };

    return (
        <div className={cn("w-full transition-all duration-300", className)}>
            {messages.length === 0 && attachments.length === 0 && uploadQueue.length === 0 && (
                <SuggestedActions submitMessage={submitMessage} />
            )}

            {attachments.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2 mb-2 scrollbar-hide">
                    {attachments.map((att, i) => (
                        <PreviewAttachment key={i} attachment={att} onRemove={() => handleRemoveAttachment(i)} />
                    ))}
                    {uploadQueue.map(id => (
                        <PreviewAttachment key={id} attachment={{ name: "...", url: "" }} isUploading />
                    ))}
                </div>
            )}

            <div className="flex flex-col w-full bg-white border border-gray-200 rounded-[1.5rem] shadow-sm focus-within:shadow-md focus-within:border-gray-300 transition-all duration-300 p-2 px-4 space-y-2">
                <Textarea
                    ref={textareaRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message NeuroFiq..."
                    className="flex-1 min-h-[40px] max-h-[200px] overflow-y-auto resize-none text-[15.5px] leading-relaxed bg-transparent border-none focus-visible:ring-0 px-0 py-2.5 text-gray-800 placeholder:text-gray-400 font-serif scrollbar-hide"
                />

                <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isGenerating}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                            <History className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Model selector removed */}

                        <SendButton
                            submitMessage={submitMessage}
                            chatInput={chatInput}
                            currentAttachments={attachments}
                            isGenerating={isGenerating}
                            stopGenerating={onStopGenerating}
                        />
                    </div>
                </div>
            </div>

            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        </div>
    );
}
