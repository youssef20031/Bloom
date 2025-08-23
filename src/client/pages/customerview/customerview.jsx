import React, { useState, useEffect } from 'react';
import './customerview.style.css';
import { Home, Briefcase, LifeBuoy, Info, Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerView({ initialSection = 'overview' }) {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const [services, setServices] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [ticketDescription, setTicketDescription] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [orders, setOrders] = useState([]);
    // Customer DB record ID for support tickets
    const [customerDbId, setCustomerDbId] = useState(null);
    // Datacenter health overview stats
    const [stats, setStats] = useState({ totalAssets: 0, assetsByType: {}, averages: {}, alerts: {} });
    const [activeSection, setActiveSection] = useState(initialSection);

    // Support section states
    const [supportPage, setSupportPage] = useState(1);
    const [supportEntries, setSupportEntries] = useState(10);
    const [supportStatusFilter, setSupportStatusFilter] = useState('all');
    const [supportSortOrder, setSupportSortOrder] = useState('newest');

    // Helper to color status badges
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return '#28a745';
            case 'close':
            case 'closed': return '#dc3545';
            case 'pending': return '#ffc107';
            case 'in-progress': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const StatusBadge = ({ status }) => (
        <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(status), color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '12px' }}>
            ● {status}
        </span>
    );

    // On mount, load logged-in user
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return navigate('/login');
        const u = JSON.parse(stored);
        setUserId(u._id || u.id);
        setUserName(u.name);
    }, [navigate]);

    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/customers/profile/${userId}`);
                const data = await res.json();
                // store customer record ID
                setCustomerDbId(data._id);
                const mappedServices = (data.purchasedServices || []).map(p => ({
                    id: p.serviceId._id,
                    name: p.serviceId.name,
                    ip: p.ipAddress,
                    subscriptionStatus: p.status
                }));
                setServices(mappedServices);
                const mappedOrders = (data.purchasedProducts || []).map(p => ({
                    id: p.productId._id,
                    name: p.productId.name,
                    datePurchased: p.purchaseDate,
                    status: p.status
                }));
                setOrders(mappedOrders);
            } catch (err) {
                console.error('Error fetching services:', err);
            }
            try {
                const allInv = await fetch('/api/invoices').then(r=>r.json());
                const filtered = allInv.filter(inv => inv.customerId === userId)
                    .map(inv => ({ id: inv._id, date: inv.issueDate, amount: inv.amount }));
                setInvoices(filtered);
            } catch (err) {
                console.error('Error fetching invoices:', err);
            }
            try {
                // Fetch datacenter health overview
                const healthRes = await fetch(`/api/datacenter/health/overview/${userId}`);
                if (healthRes.ok) {
                    const health = await healthRes.json();
                    setStats(health);
                }
            } catch (err) {
                console.error('Error fetching datacenter health overview:', err);
            }
        };
        fetchData();
        const intervalId = setInterval(fetchData, 30000); // every 30 seconds
        return () => clearInterval(intervalId);
    }, [userId]);

    // Fetch support tickets whenever customerDbId is available
    useEffect(() => {
        if (!customerDbId) return;
        const fetchTickets = async () => {
            try {
                const res = await fetch(`/api/customers/tickets/${customerDbId}`);
                const data = await res.json();
                const mappedTickets = data.map(t => ({ id: t._id, description: t.issue, status: t.status, createdAt: t.createdAt }));
                setTickets(mappedTickets);
            } catch (err) {
                console.error('Error fetching tickets:', err);
            }
        };
        fetchTickets();
        const intervalId = setInterval(fetchTickets, 30000); // every 30 seconds
        return () => clearInterval(intervalId);
    }, [customerDbId]);

    // Filter and sort support tickets
    const filteredTickets = tickets
        .filter(ticket => {
            if (supportStatusFilter === 'all') return true;
            if (supportStatusFilter === 'open') return ticket.status === 'open';
            if (supportStatusFilter === 'closed') return ticket.status === 'close' || ticket.status === 'closed';
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return supportSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex-shrink-0">
                <div className="flex items-center p-6">
                    <img
                        src="https://c.animaapp.com/TRfIm5C2/img/frame-1984077454.svg"
                        alt="Bloom logo illustration"
                        className="w-10 h-auto mr-2"
                    />
                    <span className="text-2xl font-bold">BLOOM</span>
                </div>
                <nav className="mt-8">
                    <a href="#" onClick={e => { e.preventDefault(); navigate('/dashboard'); setActiveSection('overview'); }} className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
                        <Home className="w-5 h-5 mr-3" /> Home
                    </a>
                    <a href="#" onClick={e => { e.preventDefault(); navigate('/services'); }} className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
                        <Briefcase className="w-5 h-5 mr-3" /> Services
                    </a>
                    <a href="#" onClick={e => { e.preventDefault(); navigate('/dashboard/support'); setActiveSection('support'); }} className={`flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800 ${activeSection==='support' ? 'bg-blue-800 text-white' : ''}`}>
                        <LifeBuoy className="w-5 h-5 mr-3" /> Support
                    </a>
                    <a href="#" onClick={e => { e.preventDefault(); navigate('/dashboard/info'); setActiveSection('info'); }} className={`flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800 ${activeSection==='info' ? 'bg-blue-800 text-white' : ''}`}>
                        <Info className="w-5 h-5 mr-3" /> More Info
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back, {userName}</h1>
                    <div className="flex items-center space-x-4">
                        <Bell className="text-gray-500" />
                        <img src="https://i.pravatar.cc/40" alt="User Avatar" className="w-10 h-10 rounded-full" />
                    </div>
                </header>

                {activeSection === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="stat-card">
                                <h3 className="text-gray-500">Total Assets</h3>
                                <p className="text-3xl font-bold">{stats.totalAssets}</p>
                            </div>
                            <div className="stat-card">
                                <h3 className="text-gray-500">Servers</h3>
                                <p className="text-3xl font-bold">{stats.assetsByType.server || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h3 className="text-gray-500">Storage Devices</h3>
                                <p className="text-3xl font-bold">{stats.assetsByType.storage || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h3 className="text-gray-500">Active Alerts</h3>
                                <p className="text-3xl font-bold">{stats.alerts.totalActive || 0}</p>
                            </div>
                        </div>

                        {/* Services moved to separate page */}

                        {/* Invoices Section */}
                        <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Invoices</h2>
                            <ul className="divide-y">
                                {invoices.map(inv => (
                                    <li key={inv.id} className="py-2 flex justify-between items-center">
                                        <span>{new Date(inv.date).toLocaleDateString()} - ${inv.amount}</span>
                                        <a href={`/api/invoices/${inv.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                                    </li>
                                ))}
                                {invoices.length === 0 && <li className="py-2 text-gray-500">No invoices found.</li>}
                            </ul>
                        </div>

                        {/* Orders Table */}
                        <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
                                <button className="flex items-center text-blue-600 hover:underline">
                                    Expand <Plus className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="py-3 px-4">Order Name</th>
                                        <th className="py-3 px-4">Date Purchased</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id} className="bg-gray-50 odd:bg-white">
                                            <td className="py-3 px-4">{o.name}</td>
                                            <td className="py-3 px-4">{new Date(o.datePurchased).toLocaleDateString()}</td>
                                            <td className="py-3 px-4"><span className={`status-${o.status}`}>{o.status}</span></td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-gray-500">No orders found.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
                {/* Support Ticket Section */}
                {activeSection === 'support' && (
                    <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                        {/* Submit Support Ticket */}
                        <h2 className="text-xl font-semibold mb-4">Submit Support Ticket</h2>
                        <textarea
                            className="w-full border p-2 mb-2"
                            rows="4"
                            placeholder="Describe your issue..."
                            value={ticketDescription}
                            onChange={e => setTicketDescription(e.target.value)}
                        />
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={() => {
                                fetch('/api/support-ticket', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ customerId: customerDbId, issue: ticketDescription })
                                })
                                    .then(res => res.json())
                                    .then(result => {
                                        if (result && result.ticket) {
                                            const t = result.ticket;
                                            const mapped = { id: t._id, description: t.issue, status: t.status, createdAt: t.createdAt };
                                            setTickets([mapped, ...tickets]);
                                            setTicketDescription('');
                                        }
                                    })
                                    .catch(console.error);
                            }}
                        >Submit</button>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center space-x-4 mt-6 mb-4">
                            <div className="flex items-center">
                                <label className="mr-2">Status:</label>
                                <select
                                    value={supportStatusFilter}
                                    onChange={e => { setSupportStatusFilter(e.target.value); setSupportPage(1); }}
                                    className="border p-1 rounded"
                                >
                                    <option value="all">All</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="mr-2">Sort:</label>
                                <select
                                    value={supportSortOrder}
                                    onChange={e => { setSupportSortOrder(e.target.value); setSupportPage(1); }}
                                    className="border p-1 rounded"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                            <div className="flex items-center ml-auto">
                                <label className="mr-2">Show:</label>
                                <select
                                    value={supportEntries}
                                    onChange={e => { setSupportEntries(Number(e.target.value)); setSupportPage(1); }}
                                    className="border p-1 rounded"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                </select>
                                <span className="ml-1">Rows</span>
                            </div>
                        </div>
                        {/* Tickets Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 px-4">Ticket ID</th>
                                        <th className="py-2 px-4">Description</th>
                                        <th className="py-2 px-4">Status</th>
                                        <th className="py-2 px-4">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.slice((supportPage - 1) * supportEntries, supportPage * supportEntries).map(ticket => (
                                        <tr key={ticket.id} className="odd:bg-gray-50">
                                            <td className="py-2 px-4">{ticket.id}</td>
                                            <td className="py-2 px-4">{ticket.description}</td>
                                            <td className="py-2 px-4"><StatusBadge status={ticket.status} /></td>
                                            <td className="py-2 px-4">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {filteredTickets.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-2 px-4 text-gray-500">No tickets found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <span>Page {supportPage} of {Math.ceil(filteredTickets.length / supportEntries)}</span>
                            <div className="flex space-x-2">
                                <button
                                    disabled={supportPage === 1}
                                    onClick={() => setSupportPage(supportPage - 1)}
                                    className="px-2 py-1 border rounded"
                                >‹</button>
                                {Array.from({ length: Math.ceil(filteredTickets.length / supportEntries) }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setSupportPage(page)}
                                        className={`px-2 py-1 border rounded ${supportPage === page ? 'bg-blue-600 text-white' : ''}`}
                                    >{page}</button>
                                ))}
                                <button
                                    disabled={supportPage === Math.ceil(filteredTickets.length / supportEntries)}
                                    onClick={() => setSupportPage(supportPage + 1)}
                                    className="px-2 py-1 border rounded"
                                >›</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Info Section */}
                {activeSection === 'info' && (
                    <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">More Info</h2>
                        <p className="text-gray-600">Additional information will be available here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}