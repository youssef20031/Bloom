import React from 'react';
import "./chatBot.css";

const SessionList = ({ sessions, selectedSessionId, onSelect }) => {
    return (
        <div className="session-list">
            <div className="session-list-header">Sessions</div>
            <ul>
                {sessions.map((s) => (
                    <li key={s._id} className={`session-item ${selectedSessionId === s._id ? 'active' : ''}`} onClick={() => onSelect(s)}>
                        <div className="title">{s.sessionTitle}</div>
                        <div className={`status badge status-${s.status}`}>{s.status}</div>
                        <div className="meta">{new Date(s.updatedAt).toLocaleString()}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SessionList;