import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

import "./chatBot.css";
import ChatWindow from './ChatWindow.jsx';
import ChatInput from './ChatInput.jsx';
import SessionList from './SessionList.jsx';
import Modal from './Modal.jsx';

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
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    // --- MODIFIED: More generic API base for easier use ---
    const API_BASE = 'http://localhost:3000/api';
    const PRESALES_USER_ID = user?._id || undefined;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);

    // --- NEW: State for customer dropdown ---
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    useEffect(() => {
        fetchSessions();
        fetchCustomers(); // --- NEW: Fetch customers on initial load
    }, []);

    // --- NEW: Function to fetch the list of customers ---
    const fetchCustomers = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/customers`);
            setCustomers(data);
        } catch (e) {
            console.error('Failed to load customers', e);
        }
    };

    const fetchSessions = async () => {
        try {
            const params = PRESALES_USER_ID ? { presalesUserId: PRESALES_USER_ID } : {};
            const { data } = await axios.get(`${API_BASE}/chat/sessions`, { params });
            setSessions(data);
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    };

    const handleNewSession = () => {
        setSelectedSession(null);
        // Do NOT reset selectedCustomerId, so user can pick a customer *before* starting
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
            // This axios call now returns the populated customer data
            const { data } = await axios.get(`${API_BASE}/chat/sessions/${session._id}`);
    
            // --- MODIFIED LOGIC ---
            // If the session has a customerId object, set the dropdown to its _id.
            // Otherwise, reset it to empty.
            setSelectedCustomerId(data.customerId?._id || '');
    
            const mappedMessages = data.messages.map(m => ({
                sender: m.sender === 'human' ? 'user' : 'bot',
                text: m.content
            }));
            setMessages([
                { sender: 'bot', text: `Session "${data.sessionTitle || 'Untitled'}" loaded. Continue your conversation.` },
                ...mappedMessages
            ]);
        } catch (e)
        {
            console.error('Failed to load session details', e);
            setMessages([{ sender: 'bot', text: "Error loading session. Please try again." }]);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        // --- NEW: Prevent starting a new session without a customer selected ---
        if (!selectedSession && !selectedCustomerId) {
            alert("Please select a customer before starting a new session.");
            return;
        }

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // --- MODIFIED: Switched to fetch for streaming ---
            const response = await fetch(`${API_BASE}/chat/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input,
                    sessionId: selectedSession?._id,
                    presalesUserId: PRESALES_USER_ID,
                    // --- MODIFIED: Pass customerId ONLY for new sessions ---
                    customerId: !selectedSession ? selectedCustomerId : undefined,
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !selectedSession) {
                // When a new session is created, re-fetch to get the full session object
                await fetchSessions(); 
                // Find the new session from the list and set it as selected
                const newlyCreatedSession = sessions.find(s => s._id === newSessionId) || { _id: newSessionId, status: 'active' };
                setSelectedSession(newlyCreatedSession);
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
                    if (lastMsgIndex < 0) return prev; // Safety check
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
            const response = await axios.post(`${API_BASE}/chat/report`, {
                sessionId: selectedSession._id,
                complete: true
            });
            setReportContent(response.data);
            setShowReport(true);
            
            // The second argument is no longer needed!
            await downloadFile('report_pdf'); 
            
            fetchSessions();
        } catch (error) {
            console.error('Report API error:', error);
            setReportContent('Failed to generate report.');
            setShowReport(true);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadFile = async (endpoint) => {
        if (!selectedSession) return;
        try {
            const response = await axios.post(`${API_BASE}/chat/${endpoint}`,
                { sessionId: selectedSession._id },
                { responseType: 'blob' }
            );
    
            if (response.status !== 200) throw new Error('Download failed');
            
            // --- NEW LOGIC TO PARSE FILENAME FROM HEADER ---
            let filename = `presales_report_${selectedSession._id}.pdf`; // A fallback filename
            const disposition = response.headers['content-disposition'];
    
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            // --- END OF NEW LOGIC ---
    
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Use the filename from the server (or the fallback)
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download file.');
        }
    };

    const handleDeleteSession = (sessionId) => {
        setSessionToDelete(sessionId);
        setIsModalOpen(true);
    };

    const handleCancelDelete = () => {
        setIsModalOpen(false);
        setSessionToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;
        try {
            await axios.delete(`${API_BASE}/chat/sessions/${sessionToDelete}`);
            if (selectedSession?._id === sessionToDelete) {
                handleNewSession();
            }
            fetchSessions();
        } catch (error) {
            console.error('Failed to delete session', error);
            alert('Could not delete the session. Please try again.');
        } finally {
            setIsModalOpen(false);
            setSessionToDelete(null);
        }
    };

    return (
        <div className="chatbot-wrapper">
            <div className="app-container">
                <div className="sidebar">
                    <button className="session-button" onClick={handleNewSession}>+ New Session</button>
                    <SessionList
                        sessions={sessions}
                        selectedSessionId={selectedSession?._id}
                        onSelect={handleSelectSession}
                        onDelete={handleDeleteSession}
                    />
                </div>

                <main className="main-content-area">
                    {/* Chat view */}
                    <div className={`content ${showReport ? 'hidden' : ''}`}>
                        {/* --- MODIFIED HEADER TO INCLUDE DROPDOWN --- */}
                        <header className="app-header">
                            <h1>Dell Presales Technical Assistant</h1>
                            <div className="header-controls">
                                <select
                                    className="customer-select"
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    disabled={!!selectedSession} // Disable if a session is loaded
                                    title={selectedSession ? "Start a new session to select a different customer" : "Select a customer"}
                                >
                                    <option value="">-- Select Customer --</option>
                                    {customers.map(customer => (
                                        <option key={customer._id} value={customer._id}>
                                            {customer.companyName}
                                        </option>
                                    ))}
                                </select>
                                {selectedSession && <div id="status-header" className={`badge status-${selectedSession.status || 'active'}`}>{selectedSession.status || 'active'}</div>}
                            </div>
                        </header>
                        <ChatWindow messages={messages} isLoading={isLoading} />
                        <ChatInput input={input} setInput={setInput} onSend={handleSend} onEnd={handleExit} disabled={isLoading} />
                    </div>

                    {/* Report view */}
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
            <Modal
                isOpen={isModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Session"
            >
                <p>Are you sure you want to permanently delete this session? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}