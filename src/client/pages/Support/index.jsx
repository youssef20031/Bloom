import React, { useState, useEffect } from 'react';
import './support.css';
import { getCustomerTickets } from '../../api/supportApi';

export default function App() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showEntries, setShowEntries] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        // Example: Fetch tickets for customerId 'CUST001'
        getCustomerTickets('CUST001')
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

    // Filter and sort tickets
    const filteredAndSortedTickets = tickets
        .filter(ticket => {
            if (statusFilter === 'all') return true
            if (statusFilter === 'open') return ticket.status === 'open'
            if (statusFilter === 'closed') return ticket.status === 'close'
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
                                <td className="ticket-id">{ticket._id}</td>
                                <td className="subject-text">{ticket.subject}</td>
                                <td>
                                    <StatusBadge status={ticket.status === 'close' ? 'closed' : ticket.status} />
                                </td>
                                <td className="created-at">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                <td className="customer-name">{ticket.customer.name}</td>
                                <td className="customer-email">{ticket.customer.email}</td>
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
        </div>
    )
}
