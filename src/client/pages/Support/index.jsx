
import React, { useState } from 'react'
import './support.css'

export default function App() {
    const [currentPage, setCurrentPage] = useState(1)
    const [showEntries, setShowEntries] = useState(10)
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('newest')

    const tickets = [
        { _id: 'TK0001', subject: 'Backup restore failed', status: 'open', createdAt: '2024-03-08', customer: { _id: 'CUST001', name: 'Navy', email: 'helpdesk@navy.com' }},
        { _id: 'TK0002', subject: 'Email delivery failure', status: 'open', createdAt: '2023-12-30', customer: { _id: 'CUST002', name: 'Siemens', email: 'support@siemens.com' }},
        { _id: 'TK0003', subject: 'Security patch installation', status: 'close', createdAt: '2024-11-09', customer: { _id: 'CUST003', name: 'Stripe', email: 'info@stripe.com' }},
        { _id: 'TK0004', subject: '5G network problem', status: 'close', createdAt: '2025-10-11', customer: { _id: 'CUST004', name: 'Tesla', email: 'helpdesk@tesla.com' }},
        { _id: 'TK0005', subject: 'Payment declined', status: 'open', createdAt: '2023-04-24', customer: { _id: 'CUST005', name: 'Lenovo', email: 'tech@lenovo.com' }},
        { _id: 'TK0006', subject: 'System integration issues', status: 'open', createdAt: '2025-07-03', customer: { _id: 'CUST006', name: 'Amazon', email: 'helpdesk@amazon.com' }},
        { _id: 'TK0007', subject: 'System monitoring alerts', status: 'open', createdAt: '2025-01-08', customer: { _id: 'CUST007', name: 'Philips', email: 'helpdesk@philips.com' }},
        { _id: 'TK0008', subject: 'Printer not connecting', status: 'close', createdAt: '2025-10-01', customer: { _id: 'CUST008', name: 'Accenture', email: 'helpdesk@accenture.com' }},
        { _id: 'TK0009', subject: 'VPN authentication failure', status: 'open', createdAt: '2024-10-13', customer: { _id: 'CUST009', name: 'Microsoft', email: 'tech@microsoft.com' }},
        { _id: 'TK0010', subject: 'Cloud function timeout', status: 'close', createdAt: '2024-12-10', customer: { _id: 'CUST010', name: 'Twitter', email: 'helpdesk@twitter.com' }},
        { _id: 'TK0011', subject: 'System monitoring alerts', status: 'open', createdAt: '2025-12-16', customer: { _id: 'CUST011', name: 'Airbnb', email: 'support@airbnb.com' }},
        { _id: 'TK0012', subject: 'Security patch installation', status: 'close', createdAt: '2025-06-08', customer: { _id: 'CUST012', name: 'Siemens', email: 'support@siemens.com' }},
        { _id: 'TK0013', subject: 'Security patch installation', status: 'open', createdAt: '2025-02-10', customer: { _id: 'CUST013', name: 'Hitachi', email: 'tech@hitachi.com' }},
        { _id: 'TK0014', subject: 'DNS propagation delay', status: 'open', createdAt: '2024-04-07', customer: { _id: 'CUST014', name: 'Lenovo', email: 'info@lenovo.com' }},
        { _id: 'TK0015', subject: 'Load balancer error', status: 'close', createdAt: '2024-09-22', customer: { _id: 'CUST015', name: 'Etihad', email: 'info@etihad.com' }},
        { _id: 'TK0016', subject: 'Printer not connecting', status: 'open', createdAt: '2025-02-26', customer: { _id: 'CUST016', name: 'Samsung', email: 'helpdesk@samsung.com' }},
        { _id: 'TK0017', subject: 'Payment gateway timeout issue', status: 'close', createdAt: '2025-05-02', customer: { _id: 'CUST017', name: 'GE Healthcare', email: 'info@gehealthcare.com' }},
        { _id: 'TK0018', subject: 'DNS propagation delay', status: 'close', createdAt: '2024-01-27', customer: { _id: 'CUST018', name: 'Hitachi', email: 'support@hitachi.com' }},
        { _id: 'TK0019', subject: 'SSL certificate renewal reminder', status: 'close', createdAt: '2023-11-24', customer: { _id: 'CUST019', name: 'Google', email: 'support@google.com' }},
        { _id: 'TK0020', subject: 'Repository access issue', status: 'close', createdAt: '2025-03-19', customer: { _id: 'CUST020', name: 'Norton', email: 'info@norton.com' }},
        { _id: 'TK0021', subject: 'Cloud storage latency', status: 'close', createdAt: '2025-02-14', customer: { _id: 'CUST021', name: 'HSBC', email: 'support@hsbc.com' }},
        { _id: 'TK0022', subject: 'Database replication lag observed', status: 'open', createdAt: '2024-10-11', customer: { _id: 'CUST022', name: 'BMW', email: 'helpdesk@bmw.com' }},
        { _id: 'TK0023', subject: 'Cloud storage latency', status: 'close', createdAt: '2023-07-03', customer: { _id: 'CUST023', name: 'LG', email: 'support@lg.com' }},
        { _id: 'TK0024', subject: 'ETL job failed', status: 'close', createdAt: '2025-10-27', customer: { _id: 'CUST024', name: 'Zoom', email: 'support@zoom.com' }},
        { _id: 'TK0025', subject: 'AI Chatbot configuration assistance', status: 'open', createdAt: '2024-01-06', customer: { _id: 'CUST025', name: 'Bosch', email: 'support@bosch.com' }},
        { _id: 'TK0026', subject: 'Video buffering', status: 'close', createdAt: '2025-07-20', customer: { _id: 'CUST026', name: 'Dropbox', email: 'support@dropbox.com' }},
        { _id: 'TK0027', subject: 'Backup restore failed', status: 'open', createdAt: '2024-07-23', customer: { _id: 'CUST027', name: 'Siemens', email: 'info@siemens.com' }},
        { _id: 'TK0028', subject: 'Mobile app crash report', status: 'open', createdAt: '2024-04-12', customer: { _id: 'CUST028', name: 'TikTok', email: 'support@tiktok.com' }},
        { _id: 'TK0029', subject: 'Hosting downtime issue', status: 'open', createdAt: '2023-09-12', customer: { _id: 'CUST029', name: 'General Motors', email: 'helpdesk@generalmotors.com' }},
        { _id: 'TK0030', subject: 'Load testing error', status: 'close', createdAt: '2025-09-26', customer: { _id: 'CUST030', name: 'FedEx', email: 'tech@fedex.com' }},
        { _id: 'TK0031', subject: 'Storage quota exceeded', status: 'close', createdAt: '2025-10-14', customer: { _id: 'CUST031', name: 'Shell', email: 'helpdesk@shell.com' }},
        { _id: 'TK0032', subject: 'Delay in SMS notifications', status: 'open', createdAt: '2025-01-04', customer: { _id: 'CUST032', name: '3M', email: 'support@3m.com' }},
        { _id: 'TK0033', subject: 'Cloud function timeout', status: 'open', createdAt: '2024-12-26', customer: { _id: 'CUST033', name: 'Qatar Airways', email: 'support@qatarairways.com' }},
        { _id: 'TK0034', subject: 'Cloud function timeout', status: 'close', createdAt: '2024-01-05', customer: { _id: 'CUST034', name: 'Qatar Airways', email: 'tech@qatarairways.com' }},
        { _id: 'TK0035', subject: 'DNS propagation delay', status: 'close', createdAt: '2023-08-02', customer: { _id: 'CUST035', name: 'Microsoft', email: 'tech@microsoft.com' }},
        { _id: 'TK0036', subject: 'Firewall rules misconfiguration', status: 'close', createdAt: '2025-03-21', customer: { _id: 'CUST036', name: 'Malaysia Airlines', email: 'tech@malaysiaairlines.com' }},
        { _id: 'TK0037', subject: 'Cloud function timeout', status: 'close', createdAt: '2023-12-06', customer: { _id: 'CUST037', name: 'El-Swedy', email: 'tech@el-swedy.com' }},
        { _id: 'TK0038', subject: 'ETL job failed', status: 'open', createdAt: '2025-09-25', customer: { _id: 'CUST038', name: 'Pepsi', email: 'helpdesk@pepsi.com' }},
        { _id: 'TK0039', subject: 'System integration issues', status: 'close', createdAt: '2025-11-18', customer: { _id: 'CUST039', name: 'ByteDance', email: 'tech@bytedance.com' }},
        { _id: 'TK0040', subject: 'DNS propagation delay', status: 'close', createdAt: '2025-10-01', customer: { _id: 'CUST040', name: 'Siemens', email: 'tech@siemens.com' }},
        { _id: 'TK0041', subject: 'Payment gateway timeout issue', status: 'close', createdAt: '2025-06-19', customer: { _id: 'CUST041', name: 'Siemens Health', email: 'helpdesk@siemenshealth.com' }},
        { _id: 'TK0042', subject: '5G network problem', status: 'open', createdAt: '2025-05-18', customer: { _id: 'CUST042', name: 'ProcterGamble', email: 'helpdesk@proctergamble.com' }},
        { _id: 'TK0043', subject: 'Ransomware prevention query', status: 'open', createdAt: '2025-11-11', customer: { _id: 'CUST043', name: 'Malaysia Airlines', email: 'helpdesk@malaysiaairlines.com' }},
        { _id: 'TK0044', subject: 'System monitoring alerts', status: 'close', createdAt: '2025-09-13', customer: { _id: 'CUST044', name: 'Unilever', email: 'info@unilever.com' }},
        { _id: 'TK0045', subject: 'Cloud storage latency', status: 'close', createdAt: '2023-07-09', customer: { _id: 'CUST045', name: 'Uber', email: 'info@uber.com' }},
        { _id: 'TK0046', subject: 'Cloud function timeout', status: 'open', createdAt: '2023-10-11', customer: { _id: 'CUST046', name: 'Accenture', email: 'helpdesk@accenture.com' }}
    ]

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
