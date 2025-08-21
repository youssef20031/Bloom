import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatWindow = ({ messages, isLoading }) => {
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div className="chat-window" ref={chatWindowRef}>
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                    {msg.status && <span className={`badge status-${msg.status}`}>{msg.status}</span>}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
            ))}
            {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                <div className="message bot"><p><i>Typing...</i></p></div>
            )}
        </div>
    );
};

export default ChatWindow;