import React from 'react';
import "./chatBot.css";
import "./sessionList.css"

const SessionList = ({ sessions, selectedSessionId, onSelect, onDelete }) => {

    const handleDeleteClick = (e, sessionId) => {
        e.stopPropagation(); 
        onDelete(sessionId);
    };

    return (
        <div className="session-list">
            <div id="header"  className="session-list-header">Sessions</div>
            <ul>
                {sessions.map((s) => (
                    <li id="item" key={s._id} className={`session-item ${selectedSessionId === s._id ? 'active' : ''}`} onClick={() => onSelect(s)}>
                        <div className="session-details">
                            <div id="session-title" className="title">{s.sessionTitle}</div>
                            <div id="statuss" className={`status badge status-${s.status}`}>{s.status}</div>
                            <div id="date" className="meta">{new Date(s.updatedAt).toLocaleString()}</div>
                        </div>
                        {/* --- MODIFIED: Changed icon and title --- */}
                        <button 
                            className="delete-session-btn" 
                            onClick={(e) => handleDeleteClick(e, s._id)}
                            title="Delete session"
                        >
                            &times;
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SessionList;