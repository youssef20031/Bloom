import React, { useState, useEffect } from 'react';
import './customerview.style.css';
import { Home, Briefcase, LifeBuoy, Info, Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerView() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const [services, setServices] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [ticketDescription, setTicketDescription] = useState('');
    const [invoices, setInvoices] = useState([]);

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
        // Fetch purchased services via customer profile
        fetch(`/api/customers/profile/${userId}`)
            .then(res => res.json())
            .then(data => {
                const mapped = (data.purchasedServices || []).map(p => ({
                    id: p.serviceId._id,
                    name: p.serviceId.name,
                    ip: p.ipAddress,
                    subscriptionStatus: p.status
                }));
                setServices(mapped);
            })
            .catch(console.error);
        // Fetch support tickets
        fetch(`/api/customers/tickets/${userId}`)
            .then(res => res.json())
            .then(data => {
                const mapped = data.map(t => ({ id: t._id, description: t.issue, status: t.status }));
                setTickets(mapped);
            })
            .catch(console.error);
        // Fetch invoices
        fetch('/api/invoices')
            .then(res => res.json())
            .then(all => {
                const filtered = all.filter(inv => inv.customerId === userId)
                    .map(inv => ({ id: inv._id, date: inv.issueDate, amount: inv.amount }));
                setInvoices(filtered);
            })
            .catch(console.error);
    }, [userId]);
    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex-shrink-0">
                <div className="p-6 text-2xl font-bold">BLOOM</div>
                <nav className="mt-8">
                    <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
                        <Home className="w-5 h-5 mr-3" /> Home
                    </a>
                    <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
                        <Briefcase className="w-5 h-5 mr-3" /> Services
                    </a>
                    <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
                        <LifeBuoy className="w-5 h-5 mr-3" /> Support
                    </a>
                    <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="stat-card">
                        <h3 className="text-gray-500">Storage Used</h3>
                        <p className="text-3xl font-bold">29 TB</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="text-gray-500">Storage Remaining</h3>
                        <p className="text-3xl font-bold">16 TB</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="text-gray-500">Performance</h3>
                        <p className="text-3xl font-bold text-green-500">97%</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="text-gray-500">Completed</h3>
                        <p className="text-3xl font-bold">66%</p>
                        <p className="text-sm text-gray-400">As of 08/12/2025</p>
                    </div>
                </div>

                {/* Services Section */}
                <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">My Services</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="py-3 px-4">Service Name</th>
                                <th className="py-3 px-4">IP Address</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {services.map(s => (
                                <tr key={s.id} className="bg-gray-50 odd:bg-white">
                                    <td className="py-3 px-4">{s.name}</td>
                                    <td className="py-3 px-4">{s.ip}</td>
                                    <td className="py-3 px-4">{s.subscriptionStatus}</td>
                                </tr>
                            ))}
                            {services.length === 0 && <tr><td colSpan="3" className="py-3 px-4 text-gray-500">No services found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Support Ticket Section */}
                <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
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
                                body: JSON.stringify({ customerId: userId, issue: ticketDescription })
                            })
                                .then(res => res.json())
                                .then(result => {
                                    if (result && result.ticket) {
                                        const t = result.ticket;
                                        const mapped = { id: t._id, description: t.issue, status: t.status };
                                        setTickets([mapped, ...tickets]);
                                        setTicketDescription('');
                                    }
                                })
                                .catch(console.error);
                        }}
                    >Submit</button>
                    <h3 className="text-lg font-semibold mt-6 mb-2">My Tickets</h3>
                    <ul className="list-disc list-inside">
                        {tickets.map(t => (
                            <li key={t.id}>{t.description} - <span className="font-medium">{t.status}</span></li>
                        ))}
                        {tickets.length === 0 && <li className="text-gray-500">No tickets submitted.</li>}
                    </ul>
                </div>
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
                            <tr>
                                <td className="py-3 px-4">Dell PowerShell</td>
                                <td className="py-3 px-4">April 10, 2025</td>
                                <td className="py-3 px-4"><span className="status-completed">Completed</span></td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="py-3 px-4">Data Server</td>
                                <td className="py-3 px-4">May 27, 2025</td>
                                <td className="py-3 px-4"><span className="status-progress">In Progress</span></td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Order Name</td>
                                <td className="py-3 px-4">June 6, 2025</td>
                                <td className="py-3 px-4"><span className="status-delayed">Delayed</span></td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="py-3 px-4">Order Name</td>
                                <td className="py-3 px-4">June 12, 2025</td>
                                <td className="py-3 px-4"><span className="status-completed">Completed</span></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}