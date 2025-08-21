import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import '../../index.css';
import ChatWindow from './ChatWindow.jsx';
import ChatInput from './ChatInput.jsx';
import SessionList from './SessionList.jsx';

export default function ChatBot() {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! I'm the Dell Technical Presales Assistant. How can I support your customer call today?" }
    ]);
    const [input, setInput] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [showReport, setShowReport] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);

    // --- FIX 1: Correct and consistent API base URL ---
    // Change the port if your backend runs on a different one.
    // In a production build, you would use a relative path like '/api' and a proxy.
    const API_BASE = 'http://localhost:3000/api/chat'; 
    const PRESALES_USER_ID = import.meta.env.VITE_PRESALES_USER_ID || undefined;

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const params = PRESALES_USER_ID ? { presalesUserId: PRESALES_USER_ID } : {};
            // --- FIX 2: Use the correct, consistent path ---
            const { data } = await axios.get(`${API_BASE}/sessions`, { params });
            setSessions(data);
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    };

    const handleNewSession = () => {
        setSelectedSession(null);
        setMessages([
            { sender: 'bot', text: "New session started. How can I help?" }
        ]);
        setShowReport(false);
        setReportContent('');
    };

    const handleSelectSession = async (session) => {
        setSelectedSession(session);
        setShowReport(false);
        try {
            // --- FIX 3: Use the correct, consistent path ---
            const { data } = await axios.get(`${API_BASE}/sessions/${session._id}`);
            const mappedMessages = data.messages.map(m => ({
                sender: m.sender === 'human' ? 'user' : 'bot',
                text: m.content
            }));
            setMessages([
                { sender: 'bot', text: `Session "${data.sessionTitle}" loaded. Continue your conversation.` },
                ...mappedMessages
            ]);
        } catch (e) {
            console.error('Failed to load session details', e);
            setMessages([{ sender: 'bot', text: "Error loading session. Please try again." }]);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // --- FIX 4: Use the correct, consistent path ---
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input,
                    sessionId: selectedSession?._id,
                    presalesUserId: PRESALES_USER_ID // Send it if available, backend will handle if it's undefined
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !selectedSession) {
                setSelectedSession({ _id: newSessionId, status: 'active' });
                fetchSessions();
            }

            let botMessage = { sender: 'bot', text: '' };
            setMessages(prev => [...prev, botMessage]);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const lastMsgIndex = prev.length - 1;
                    const newMessages = [...prev];
                    newMessages[lastMsgIndex] = { ...newMessages[lastMsgIndex], text: newMessages[lastMsgIndex].text + chunk };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Chat API error:', error);
            const errorMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExit = async () => {
        if (!selectedSession) return;
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/report`, {
                sessionId: selectedSession._id,
                complete: true
            });
            setReportContent(response.data);
            setShowReport(true);
            await downloadFile('report_pdf', `presales_report_${selectedSession._id}.pdf`);
            fetchSessions();
        } catch (error) {
            console.error('Report API error:', error);
            setReportContent('Failed to generate report.');
            setShowReport(true);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadFile = async (endpoint, filename) => {
        if (!selectedSession) return;
        try {
            const response = await axios.post(`${API_BASE}/${endpoint}`,
                { sessionId: selectedSession._id },
                { responseType: 'blob' }
            );
            if (response.status !== 200) throw new Error('Download failed');
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download file.');
        }
    };

    // ... (all your functions and state remain the same) ...

    return (
        <div className="app-container layout-with-sidebar">
            <div className="sidebar">
                <button onClick={handleNewSession}>+ New Session</button>
                <SessionList sessions={sessions} selectedSessionId={selectedSession?._id} onSelect={handleSelectSession} />
            </div>

            {/* --- THIS IS THE FIX --- */}
            {/* A new wrapper for the main content area. This is now the grid's 2nd child. */}
            <main className="main-content-area">
                
                {/* Chat view is now INSIDE the wrapper */}
                <div className={`content ${showReport ? 'hidden' : ''}`}>
                    <header className="app-header">
                        <h1>Dell Presales Technical Assistant</h1>
                        {selectedSession && <div className={`badge status-${selectedSession.status}`}>{selectedSession.status}</div>}
                    </header>
                    <ChatWindow messages={messages} isLoading={isLoading} />
                    <ChatInput input={input} setInput={setInput} onSend={handleSend} onEnd={handleExit} disabled={isLoading} />
                </div>

                {/* Report view is also INSIDE the wrapper */}
                <div className={`report-view ${showReport ? '' : 'hidden'}`}>
                    <header className="app-header">
                        <h1>Presales Call Summary Report</h1>
                    </header>
                    <div className="report-content report-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                    </div>
                    <button onClick={() => setShowReport(false)}>Back to Chat</button>
                </div>

            </main>
        </div>
    );

}