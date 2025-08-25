import React, { useState, useEffect } from 'react';
import './support.css';
import { listSupportTickets, getSupportTicket, updateTicketStatus, submitChangeRequest } from '../../api/supportApi';

export default function App() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showEntries, setShowEntries] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    // Add state for change request modal and form fields
    const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
    const [changeRequestTag, setChangeRequestTag] = useState('');
    const [changeRequestDescription, setChangeRequestDescription] = useState('');
    const [changeRequestError, setChangeRequestError] = useState('');
    const [changeRequestLoading, setChangeRequestLoading] = useState(false);
    const [changeRequestSuccess, setChangeRequestSuccess] = useState('');

    useEffect(() => {
        // Fetch all support tickets from the database
        listSupportTickets()
            .then(data => {
                setTickets(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open':
                return '#28a745'
            case 'close':
            case 'closed':
                return '#dc3545'
            case 'pending':
                return '#ffc107'
            case 'in-progress':
                return '#17a2b8'
            default:
                return '#6c757d'
        }
    }

    const StatusBadge = ({ status }) => (
        <span
            className="status-badge"
            style={{
                backgroundColor: getStatusColor(status),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}
        >
      ● {status}
    </span>
    )

    const handleTicketIdClick = async (ticketId) => {
        setSelectedTicketId(ticketId);
        setShowDetailsModal(true);
        setDetailsLoading(true);
        setDetailsError(null);
        try {
            const details = await getSupportTicket(ticketId);
            setTicketDetails(details);
        } catch (err) {
            setDetailsError(err.message);
        }
        setDetailsLoading(false);
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTicketId) return;
        setDetailsLoading(true);
        setDetailsError(null);
        try {
            const updated = await updateTicketStatus(selectedTicketId, newStatus);
            setTicketDetails(updated.ticket);
            // Optionally update main ticket list
            setTickets(tickets.map(t => t._id === selectedTicketId ? updated.ticket : t));
        } catch (err) {
            setDetailsError(err.message);
        }
        setDetailsLoading(false);
    };

    // Filter and sort tickets
    const filteredAndSortedTickets = tickets
        .filter(ticket => {
            if (statusFilter === 'all') return true
            if (statusFilter === 'open') return ticket.status === 'open'
            if (statusFilter === 'in_progress') return ticket.status === 'in_progress'
            if (statusFilter === 'closed') return ticket.status === 'closed'
            return true
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt)
            const dateB = new Date(b.createdAt)
            if (sortOrder === 'newest') {
                return dateB - dateA
            } else {
                return dateA - dateB
            }
        })

    if (loading) return <div>Loading support tickets...</div>;
    if (error) return <div>Error: {error}</div>;

    // Status options and colors
    const statusOptions = [
        { value: 'open', label: 'Open', color: '#28a745' },
        { value: 'in_progress', label: 'In Progress', color: '#17a2b8' },
        { value: 'closed', label: 'Closed', color: '#dc3545' }
    ];

    // Handler for sending change request
    const handleSendChangeRequest = async () => {
        if (!changeRequestTag) {
            setChangeRequestError('Tag is required.');
            return;
        }
        setChangeRequestLoading(true);
        setChangeRequestError('');
        setChangeRequestSuccess('');
        try {
            // Use a valid user ID from your database here
            await submitChangeRequest(ticketDetails._id, changeRequestTag.toLowerCase(), changeRequestDescription, '64e7b2f8c2a1e2d4f8a12345');
            setChangeRequestSuccess('Change request sent successfully!');
            // Refresh ticket details to show new message
            const updatedDetails = await getSupportTicket(ticketDetails._id);
            setTicketDetails(updatedDetails);
            setShowChangeRequestModal(false);
            setChangeRequestTag('');
            setChangeRequestDescription('');
        } catch (err) {
            setChangeRequestError(err.message || 'Failed to send change request');
        }
        setChangeRequestLoading(false);
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <img src="/bloom-logo.svg" alt="BLOOM" className="bloom-icon" />
                    <span className="bloom-text">BLOOM</span>
                </div>
                <nav className="nav">
                    <a href="#" className="nav-link">Home</a>
                    <a href="#" className="nav-link">Services</a>
                    <a href="#" className="nav-link">Support</a>
                    <a href="#" className="nav-link">More Info ▼</a>
                </nav>
                <div className="user-actions">
                    <button className="notification-btn">🔔</button>
                    <div className="user-avatar">👤</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <h1 className="welcome-title">Welcome Back, Radwan</h1>

                {/* Filters */}
                <div className="filters-container">
                    <div className="filter-group">
                        <label>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="filter-select"
                        >
                            <option value="all">All</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort by Date:</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="filter-select"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Customer Name</th>
                            <th>Customer Email</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredAndSortedTickets.slice((currentPage - 1) * showEntries, currentPage * showEntries).map(ticket => (
                            <tr key={ticket._id}>
                                <td className="ticket-id">
                                    <button style={{background:'none',border:'none',color:'#007bff',cursor:'pointer',textDecoration:'underline'}} onClick={() => handleTicketIdClick(ticket._id)}>
                                        {ticket._id}
                                    </button>
                                </td>
                                <td className="subject-text">{ticket.issue}</td>
                                <td>
                                    <StatusBadge status={ticket.status === 'closed' ? 'closed' : ticket.status} />
                                </td>
                                <td className="created-at">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                <td className="customer-name">{ticket.customerId?.companyName || ''}</td>
                                <td className="customer-email">{ticket.customerId?.email || ''}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-container">
                    <div className="show-entries">
                        <span>Show </span>
                        <select
                            value={showEntries}
                            onChange={(e) => {
                                setShowEntries(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="entries-select"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span> Row</span>
                    </div>

                    <div className="pagination">
                        <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            ‹
                        </button>
                        {Array.from({ length: Math.ceil(filteredAndSortedTickets.length / showEntries) }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className="page-btn"
                            disabled={currentPage === Math.ceil(filteredAndSortedTickets.length / showEntries)}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </main>

            {/* Ticket Details Modal */}
            {showDetailsModal && (
                <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000}}>
                    <div className="modal-content" style={{background:'#fff',padding:'2rem',borderRadius:'8px',maxWidth:'600px',margin:'5% auto',position:'relative'}}>
                        <button style={{position:'absolute',top:'1rem',right:'1rem',fontSize:'1.5rem',background:'none',border:'none',cursor:'pointer'}} onClick={()=>{setShowDetailsModal(false);setTicketDetails(null);setSelectedTicketId(null);}}>&times;</button>
                        {detailsLoading ? <div>Loading...</div> : detailsError ? <div>Error: {detailsError}</div> : ticketDetails && (
                            <div>
                                <h2>Ticket Details</h2>
                                <p><strong>ID:</strong> {ticketDetails._id}</p>
                                <p><strong>Issue:</strong> {ticketDetails.issue}</p>
                                <p><strong>Status:</strong> <StatusBadge status={ticketDetails.status} /></p>
                                <p><strong>Priority:</strong> {ticketDetails.priority}</p>
                                <p><strong>Created At:</strong> {new Date(ticketDetails.createdAt).toLocaleString()}</p>
                                <p><strong>Customer:</strong> {ticketDetails.customerId?.companyName} ({ticketDetails.customerId?.contactPerson})</p>
                                <p><strong>Support Agent:</strong> {ticketDetails.supportAgentId?.name || 'Unassigned'}</p>
                                <div style={{margin:'1rem 0'}}>
                                    <label htmlFor="status-select"><strong>Change Status:</strong></label>
                                    <div style={{marginTop:'0.5rem'}}>
                                        {statusOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleStatusChange(opt.value)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    marginRight: '1rem',
                                                    padding: '6px 16px',
                                                    borderRadius: '16px',
                                                    border: ticketDetails.status === opt.value ? '2px solid #333' : '1px solid #ccc',
                                                    background: opt.color,
                                                    color: '#fff',
                                                    fontWeight: ticketDetails.status === opt.value ? 'bold' : 'normal',
                                                    cursor: 'pointer',
                                                    boxShadow: ticketDetails.status === opt.value ? '0 0 4px #333' : 'none',
                                                    outline: 'none'
                                                }}
                                            >
                                                <span style={{width:16,height:16,display:'inline-block',borderRadius:'50%',background:opt.color,marginRight:8,border:'2px solid #fff'}}></span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Add Change Request button for Open tickets */}
                                {ticketDetails.status === 'in_progress' && (
                                    <button
                                        style={{marginTop:'1rem',padding:'8px 20px',borderRadius:'8px',background:'#6366f1',color:'#fff',fontWeight:'bold',border:'none',cursor:'pointer'}}
                                        onClick={() => {
                                            setChangeRequestTag('');
                                            setChangeRequestDescription('');
                                            setShowChangeRequestModal(true);
                                        }}
                                    >
                                        Change Request
                                    </button>
                                )}
                                {/* Change Request Modal */}
                                {showChangeRequestModal && (
                                    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1100}}>
                                        <div className="modal-content" style={{background:'#fff',padding:'2rem',borderRadius:'8px',maxWidth:'400px',margin:'10% auto',position:'relative'}}>
                                            <button style={{position:'absolute',top:'1rem',right:'1rem',fontSize:'1.5rem',background:'none',border:'none',cursor:'pointer'}} onClick={()=>setShowChangeRequestModal(false)}>&times;</button>
                                            <h3>Submit Change Request</h3>
                                            <div style={{margin:'1rem 0'}}>
                                                <label htmlFor="tag-select"><strong>Tag <span style={{color:'red'}}>*</span>:</strong></label>
                                                <select id="tag-select" value={changeRequestTag} onChange={e=>setChangeRequestTag(e.target.value)} style={{width:'100%',padding:'8px',marginTop:'0.5rem',borderRadius:'6px',fontWeight:'bold',background:changeRequestTag==='AI'?'#e0f7fa':changeRequestTag==='DC'?'#f3e8ff':'#f8fafc',color:'#333',border:'2px solid #6366f1'}} required>
                                                    <option value="" style={{background:'#f8fafc',color:'#333'}}>Select Tag</option>
                                                    <option value="AI" style={{background:'#e0f7fa',color:'#00796b'}}>AI</option>
                                                    <option value="DC" style={{background:'#f3e8ff',color:'#6d28d9'}}>DC</option>
                                                </select>
                                            </div>
                                            <div style={{margin:'1rem 0'}}>
                                                <label htmlFor="desc-text"><strong>Description (optional):</strong></label>
                                                <textarea id="desc-text" value={changeRequestDescription} onChange={e=>setChangeRequestDescription(e.target.value)} style={{width:'100%',padding:'8px',marginTop:'0.5rem',minHeight:'60px',borderRadius:'6px',background:'#f8fafc',border:'2px solid #6366f1',color:'#333',fontSize:'15px'}} placeholder="Describe your change request..." />
                                            </div>
                                            {changeRequestLoading && <div style={{color:'#6366f1',marginBottom:'1rem'}}>Sending...</div>}
                                            {changeRequestError && <div style={{color:'red',marginBottom:'1rem'}}>{changeRequestError}</div>}
                                            {changeRequestSuccess && <div style={{color:'#16a34a',marginBottom:'1rem'}}>{changeRequestSuccess}</div>}
                                            <button
                                                style={{padding:'8px 20px',borderRadius:'8px',background:'#16a34a',color:'#fff',fontWeight:'bold',border:'none',cursor:'pointer'}}
                                                onClick={handleSendChangeRequest}
                                                disabled={changeRequestLoading}
                                            >
                                                Send Change Request
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h3>History</h3>
                                    <ul>
                                        {ticketDetails.history?.map((h,i)=>(
                                            <li key={i}><strong>{h.author?.name || h.author}:</strong> {h.message} <em>({new Date(h.timestamp).toLocaleString()})</em></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
