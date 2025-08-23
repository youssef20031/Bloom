import React, { useState, useEffect } from 'react';
import './customerview.style.css';
import { Home, Briefcase, LifeBuoy, Info, Bell, Plus, ChevronDown, Server, Database, HardDrive, AlertTriangle, FileText, ArrowUp, ArrowDown, Minus, LogOut, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerView({ initialSection = 'overview' }) {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const [services, setServices] = useState([]); // kept for potential future use (Add Service action)
    const [tickets, setTickets] = useState([]);
    const [ticketDescription, setTicketDescription] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceError, setInvoiceError] = useState(null);
    const [orders, setOrders] = useState([]);
    const [customerDbId, setCustomerDbId] = useState(null);
    const [stats, setStats] = useState({ totalAssets: 0, assetsByType: {}, averages: {}, alerts: {} });
    const [activeSection, setActiveSection] = useState(initialSection);

    // Support ticket view controls
    const [supportPage, setSupportPage] = useState(1);
    const [supportEntries, setSupportEntries] = useState(10);
    const [supportStatusFilter, setSupportStatusFilter] = useState('all');
    const [supportSortOrder, setSupportSortOrder] = useState('newest');

    // Helper to color status badges
    const getStatusColor = (status) => {
        if (!status) return '#6c757d';
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
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: getStatusColor(status), color: 'white' }}>
            ● {status}
        </span>
    );

    // Load logged in user
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return navigate('/login');
        try {
            const u = JSON.parse(stored);
            setUserId(u._id || u.id);
            setUserName(u.name || 'User');
        } catch (e) {
            console.error('Failed parsing user from storage');
        }
    }, [navigate]);

    // Fetch profile + invoices + health periodically
    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/customers/profile/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCustomerDbId(data._id);
                    const mappedServices = (data.purchasedServices || []).map(p => ({
                        id: p.serviceId._id,
                        name: p.serviceId.name,
                        ip: p.ipAddress,
                        subscriptionStatus: p.status,
                        datePurchased: p.purchaseDate,
                        kind: 'service'
                    }));
                    setServices(mappedServices);
                    const productEntries = (data.purchasedProducts || []).map(p => ({
                        id: p.productId._id,
                        name: p.productId.name,
                        datePurchased: p.purchaseDate,
                        status: p.status,
                        kind: 'product'
                    }));
                    setOrders([...mappedServices.map(s=>({id:s.id,name:s.name,datePurchased:s.datePurchased,status:s.subscriptionStatus,kind:'service'})), ...productEntries]);
                }
            } catch (err) { console.error('Error fetching services/orders', err); }
            try {
                setInvoiceLoading(true); setInvoiceError(null);
                const allInv = await fetch('/api/invoices').then(r => r.ok ? r.json() : []);
                const filtered = (allInv || []).filter(inv => {
                    const cid = typeof inv.customerId === 'string' ? inv.customerId : inv.customerId?._id;
                    return cid === userId;
                }).map(inv => ({ id: inv._id, date: inv.issueDate, amount: inv.amount, status: inv.status }));
                setInvoices(filtered);
            } catch (err) { console.error('Error fetching invoices', err); setInvoiceError('Failed to load invoices'); }
            finally { setInvoiceLoading(false); }
            try {
                const healthRes = await fetch(`/api/datacenter/health/overview/${userId}`);
                if (healthRes.ok) {
                    const health = await healthRes.json();
                    setStats(health);
                }
            } catch (err) { console.error('Error fetching health overview', err); }
        };
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [userId]);

    // Helper to refetch invoices only (retry button)
    const refetchInvoices = async () => {
        if (!userId) return;
        try {
            setInvoiceLoading(true); setInvoiceError(null);
            const allInv = await fetch('/api/invoices').then(r => r.ok ? r.json() : []);
            const filtered = (allInv || []).filter(inv => {
                const cid = typeof inv.customerId === 'string' ? inv.customerId : inv.customerId?._id;
                return cid === userId;
            }).map(inv => ({ id: inv._id, date: inv.issueDate, amount: inv.amount, status: inv.status }));
            setInvoices(filtered);
        } catch (e) { setInvoiceError('Failed to load invoices'); }
        finally { setInvoiceLoading(false); }
    };

    // Listen for service selection updates from Services page via localStorage event
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'servicesUpdated') {
                if (userId) {
                    // Re-run invoice + profile fetch (lightweight subset)
                    fetch(`/api/customers/profile/${userId}`).then(r=> r.ok ? r.json(): null).then(data => {
                        if (!data) return;
                        setCustomerDbId(data._id);
                        const mappedServices = (data.purchasedServices || []).map(p => ({
                            id: p.serviceId._id,
                            name: p.serviceId.name,
                            ip: p.ipAddress,
                            subscriptionStatus: p.status,
                            datePurchased: p.purchaseDate,
                            kind: 'service'
                        }));
                        setServices(mappedServices);
                        const productEntries = (data.purchasedProducts || []).map(p => ({
                            id: p.productId._id,
                            name: p.productId.name,
                            datePurchased: p.purchaseDate,
                            status: p.status,
                            kind: 'product'
                        }));
                        setOrders([...mappedServices.map(s=>({id:s.id,name:s.name,datePurchased:s.datePurchased,status:s.subscriptionStatus,kind:'service'})), ...productEntries]);
                    }).catch(()=>{});
                    fetch('/api/invoices').then(r=> r.ok? r.json(): []).then(allInv => {
                        const filtered = (allInv || []).filter(inv => {
                            const cid = typeof inv.customerId === 'string' ? inv.customerId : inv.customerId?._id;
                            return cid === userId;
                        }).map(inv => ({ id: inv._id, date: inv.issueDate, amount: inv.amount, status: inv.status }));
                        setInvoices(filtered);
                    }).catch(()=>{ setInvoiceError('Failed to load invoices'); });
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [userId]);

    // Fetch support tickets periodically
    useEffect(() => {
        if (!customerDbId) return;
        const fetchTickets = async () => {
            try {
                const res = await fetch(`/api/customers/tickets/${customerDbId}`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.map(t => ({ id: t._id, description: t.issue, status: t.status, createdAt: t.createdAt }));
                    setTickets(mapped);
                }
            } catch (err) { console.error('Error fetching tickets', err); }
        };
        fetchTickets();
        const id = setInterval(fetchTickets, 30000);
        return () => clearInterval(id);
    }, [customerDbId]);

    // Derived data & helpers
    const filteredTickets = tickets
        .filter(ticket => {
            if (supportStatusFilter === 'all') return true;
            if (supportStatusFilter === 'open') return ticket.status === 'open';
            if (supportStatusFilter === 'closed') return ticket.status === 'close' || ticket.status === 'closed';
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt); const dateB = new Date(b.createdAt);
            return supportSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const openTicketCount = tickets.filter(t => (t.status || '').toLowerCase() === 'open').length;
    const recentInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const invoiceOutstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const recentOrders = [...orders].sort((a, b) => new Date(b.datePurchased) - new Date(a.datePurchased)).slice(0, 5);

    // Count-up animation for stats when stats values change
    useEffect(() => {
        const counters = document.querySelectorAll('.count-up');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target') || '0');
            const duration = 800;
            const start = 0;
            const startTime = performance.now();
            function animate(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.floor(start + (target - start) * progress);
                counter.textContent = value.toString();
                if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        });
    }, [stats]);

    // Action handlers
    const handleCreateTicket = () => {
        setActiveSection('support');
        // slight timeout to scroll after render
        setTimeout(() => { const el = document.getElementById('support-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);
    };
    const handleAddService = () => navigate('/services');
    const handleViewBilling = () => {
        setActiveSection('billing');
        setTimeout(()=>{ const el = document.getElementById('billing-section'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 50);
    };
    const handleViewOrders = () => {
        setActiveSection('orders');
        setTimeout(()=>{ const el = document.getElementById('orders-section'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 50);
    };
    const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };

    // Subcomponents (collocated for clarity)
    const Sidebar = () => (
        <aside
            className="w-64 bg-primary-900 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-950 text-white flex-shrink-0 shadow-2xl relative overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, hsl(224,64%,33%), hsl(224,64%,33%) 10%, hsl(226,71%,40%) 55%, hsl(226,60%,23%) 100%)' }}
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-white to-transparent rounded-full translate-x-20 translate-y-20" />
            </div>
            <div className="relative z-10 p-6 border-b border-primary-700/50">
                <div className="flex items-center space-x-3">
                    <img src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=80&q=60" alt="BLOOM Logo" className="w-10 h-10 rounded-lg shadow-lg ring-2 ring-white/20" />
                    <span className="text-xl font-bold tracking-tight">BLOOM</span>
                </div>
            </div>
            <nav className="relative z-10 flex-1 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3">Navigation</h3>
                <button onClick={() => setActiveSection('overview')} className={`group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${activeSection === 'overview' ? 'bg-white/10 text-white' : 'text-primary-200 hover:text-white hover:bg-white/10'}`}> <Home className="w-5 h-5 mr-3" /> Overview </button>
                <button onClick={() => navigate('/services')} className="group flex w-full items-center px-4 py-3 rounded-xl text-primary-200 hover:text-white hover:bg-white/10 font-medium transition-all duration-200 relative overflow-hidden"> <Briefcase className="w-5 h-5 mr-3" /> Services </button>
                <button onClick={() => setActiveSection('support')} className={`group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${activeSection === 'support' ? 'bg-white/10 text-white' : 'text-primary-200 hover:text-white hover:bg-white/10'}`}> <LifeBuoy className="w-5 h-5 mr-3" /> Support <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold min-w-[1.25rem] text-center" data-testid="text-open-tickets-count">{openTicketCount}</span></button>
                <button onClick={() => setActiveSection('billing')} className={`group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${activeSection === 'billing' ? 'bg-white/10 text-white' : 'text-primary-200 hover:text-white hover:bg-white/10'}`}> <FileText className="w-5 h-5 mr-3" /> Billing </button>
                <button onClick={() => setActiveSection('orders')} className={`group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${activeSection === 'orders' ? 'bg-white/10 text-white' : 'text-primary-200 hover:text-white hover:bg-white/10'}`}> <ShoppingCart className="w-5 h-5 mr-3" /> Orders </button>
                <button onClick={() => setActiveSection('info')} className={`group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${activeSection === 'info' ? 'bg-white/10 text-white' : 'text-primary-200 hover:text-white hover:bg-white/10'}`}> <Info className="w-5 h-5 mr-3" /> More Info </button>
            </nav>
            <div className="relative z-10 p-6 border-t border-primary-700/50">
                <div className="flex items-center space-x-3">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=60" alt="User Avatar" className="w-10 h-10 rounded-full ring-2 ring-white/30" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate" data-testid="text-username">{userName}</p>
                        <p className="text-xs text-primary-300">Customer</p>
                    </div>
                    <button className="p-2 text-primary-300 hover:text-white transition-colors" onClick={handleLogout} data-testid="button-logout"><LogOut className="w-4 h-4" /></button>
                </div>
            </div>
        </aside>
    );

    const Header = () => (
        <header className="glassmorphism sticky top-0 z-40 border-b border-white/20 p-6 bg-white/60 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-700">Welcome Back, <span className="text-primary-800">{userName}</span></h1>
                    <p className="text-gray-600 mt-1 font-medium">Here's what's happening with your services today.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-xl transition-all group" data-testid="button-notifications">
                        <Bell className="w-6 h-6" />
                        {openTicketCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{openTicketCount}</span>
                        )}
                    </button>
                    <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl p-2 hover:bg-white/80 transition-all cursor-pointer group">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=60" alt="User Avatar" className="w-10 h-10 rounded-full ring-2 ring-primary-200" />
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>
        </header>
    );

    const StatCard = ({ label, value, icon: Icon, trend, trendDir }) => (
        <div className="stat-card-hover glassmorphism rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 count-up" data-target={value}>{value}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {trend !== undefined && (
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 font-semibold text-sm ${trendDir === 'up' ? 'text-emerald-600' : trendDir === 'down' ? 'text-red-600' : 'text-amber-600'}`}> {trendDir === 'up' ? <ArrowUp className="w-4 h-4" /> : trendDir === 'down' ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />} <span>{trend}%</span></div>
                    <span className="text-gray-500 text-sm">vs last month</span>
                </div>
            )}
        </div>
    );

    const StatsGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <StatCard label="My Services" value={services.length || 0} icon={Briefcase} trend={0} trendDir="flat" />
            <StatCard label="Total Assets" value={stats.totalAssets || 0} icon={Database} trend={12} trendDir="up" />
            <StatCard label="Active Servers" value={stats.assetsByType.server || 0} icon={Server} trend={8} trendDir="up" />
            <StatCard label="Storage Devices" value={stats.assetsByType.storage || 0} icon={HardDrive} trend={2} trendDir={ (stats.assetsByType.storage||0) >= 0 ? 'down' : 'up'} />
            <StatCard label="Active Alerts" value={stats.alerts.totalActive || 0} icon={AlertTriangle} trend={25} trendDir="flat" />
        </div>
    );

    const QuickActions = () => (
        <div className="glassmorphism rounded-2xl p-8 border border-white/20 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Support */}
                <button className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl p-6 text-left transition-all hover:shadow-xl" onClick={handleCreateTicket}>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4"><LifeBuoy className="w-6 h-6 text-white" /></div>
                    <h3 className="font-bold text-gray-900 mb-2">Create Support Ticket</h3>
                    <p className="text-gray-600 text-sm">Get help with your services</p>
                </button>
                {/* Add Service */}
                <button className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl p-6 text-left transition-all hover:shadow-xl" onClick={handleAddService}>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4"><Plus className="w-6 h-6 text-white" /></div>
                    <h3 className="font-bold text-gray-900 mb-2">Add Service</h3>
                    <p className="text-gray-600 text-sm">Expand your infrastructure</p>
                </button>
                {/* Billing */}
                <button className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-200 hover:border-amber-300 rounded-xl p-6 text-left transition-all hover:shadow-xl" onClick={handleViewBilling}>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4"><FileText className="w-6 h-6 text-white" /></div>
                    <h3 className="font-bold text-gray-900 mb-2">View Billing</h3>
                    <p className="text-gray-600 text-sm">Manage your invoices</p>
                </button>
                {/* Orders */}
                <button className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 hover:border-purple-300 rounded-xl p-6 text-left transition-all hover:shadow-xl" onClick={handleViewOrders}>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4"><ShoppingCart className="w-6 h-6 text-white" /></div>
                    <h3 className="font-bold text-gray-900 mb-2">View Orders</h3>
                    <p className="text-gray-600 text-sm">All your purchases</p>
                </button>
            </div>
        </div>
    );

    const RecentSections = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Invoices */}
            <div className="glassmorphism rounded-2xl p-8 border border-white/20 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Invoices</h3>
                </div>
                {recentInvoices.length === 0 && !invoiceLoading && !invoiceError ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-gray-400" /></div>
                        <p className="text-gray-500 font-medium mb-2">No invoices found</p>
                        <p className="text-gray-400 text-sm">Your recent invoices will appear here</p>
                    </div>
                ) : invoiceLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading invoices...</div>
                ) : invoiceError ? (
                    <div className="py-6 text-center">
                        <p className="text-sm text-red-600 mb-3">{invoiceError}</p>
                        <button onClick={refetchInvoices} className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700">Retry</button>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {recentInvoices.map(inv => (
                            <li key={inv.id} className="py-3 flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">{new Date(inv.date).toLocaleDateString()}</span>
                                    <span className="text-xs text-gray-400">#{inv.id.slice(-6)}</span>
                                </div>
                                <span className="font-semibold text-gray-900">${inv.amount}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize shadow-sm
                                    ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span>
                                <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-4" download>
                                    PDF
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">Total Outstanding</span>
                        <span className="font-bold text-xl text-gray-900" data-testid="text-total-outstanding">${invoiceOutstanding.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="glassmorphism rounded-2xl p-8 border border-white/20 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-200 mb-4 text-sm font-semibold text-gray-600">
                    <span>Item</span><span>Date</span><span>Status</span>
                </div>
                {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingCart className="w-8 h-8 text-gray-400" /></div>
                        <p className="text-gray-500 font-medium mb-2">No orders found</p>
                        <p className="text-gray-400 text-sm">Your recent orders will appear here</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {recentOrders.map(o => (
                            <li key={o.id} className="grid grid-cols-3 gap-4 items-center text-sm">
                                <span className="font-medium text-gray-700 truncate" title={o.name}>{o.name}</span>
                                <span className="text-gray-600">{new Date(o.datePurchased).toLocaleDateString()}</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 capitalize`}>{o.status}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    const SupportSection = () => (
        <div id="support-section" className="glassmorphism rounded-2xl p-8 border border-white/20 bg-white mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Support Tickets</h2>
            {/* Create Ticket */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Submit a Ticket</h3>
                <textarea className="w-full border rounded-md p-3 resize-y" rows={4} placeholder="Describe your issue..." value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} />
                <div className="mt-2 flex justify-end">
                    <button disabled={!ticketDescription.trim()} className="bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center gap-2" onClick={() => {
                        const submit = async () => {
                            try {
                                const res = await fetch('/api/support-ticket', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ customerId: customerDbId, issue: ticketDescription })
                                });
                                const result = await res.json();
                                if (result && result.ticket) {
                                    const t = result.ticket;
                                    const mapped = { id: t._id, description: t.issue, status: t.status, createdAt: t.createdAt };
                                    setTickets([mapped, ...tickets]);
                                    setTicketDescription('');
                                    setSupportPage(1);
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        };
                        submit();
                    }}>Submit <Plus className="w-4 h-4" /></button>
                </div>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <label className="flex items-center gap-2">Status: <select value={supportStatusFilter} onChange={e => { setSupportStatusFilter(e.target.value); setSupportPage(1); }} className="border p-1 rounded"><option value="all">All</option><option value="open">Open</option><option value="closed">Closed</option></select></label>
                <label className="flex items-center gap-2">Sort: <select value={supportSortOrder} onChange={e => { setSupportSortOrder(e.target.value); setSupportPage(1); }} className="border p-1 rounded"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select></label>
                <label className="flex items-center gap-2 ml-auto">Show: <select value={supportEntries} onChange={e => { setSupportEntries(Number(e.target.value)); setSupportPage(1); }} className="border p-1 rounded"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select> Rows</label>
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="py-2 px-4">Ticket ID</th>
                            <th className="py-2 px-4">Description</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.slice((supportPage - 1) * supportEntries, supportPage * supportEntries).map(ticket => (
                            <tr key={ticket.id} className="odd:bg-white even:bg-gray-50">
                                <td className="py-2 px-4 font-mono text-xs">{ticket.id}</td>
                                <td className="py-2 px-4 max-w-xs">{ticket.description}</td>
                                <td className="py-2 px-4"><StatusBadge status={ticket.status} /></td>
                                <td className="py-2 px-4">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                            <tr><td colSpan="4" className="py-4 px-4 text-center text-gray-500">No tickets found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="flex flex-wrap justify-between items-center mt-4 gap-4">
                <span className="text-sm">Page {supportPage} of {Math.max(1, Math.ceil(filteredTickets.length / supportEntries))}</span>
                <div className="flex space-x-2">
                    <button disabled={supportPage === 1} onClick={() => setSupportPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">‹</button>
                    {Array.from({ length: Math.ceil(filteredTickets.length / supportEntries) || 1 }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setSupportPage(page)} className={`px-2 py-1 border rounded ${supportPage === page ? 'bg-blue-600 text-white' : ''}`}>{page}</button>
                    ))}
                    <button disabled={supportPage === Math.ceil(filteredTickets.length / supportEntries) || filteredTickets.length === 0} onClick={() => setSupportPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">›</button>
                </div>
            </div>
        </div>
    );

    const BillingSection = () => {
        const [statusFilter, setStatusFilter] = useState('all');
        const sorted = [...invoices].sort((a,b)=> new Date(b.date)-new Date(a.date));
        const filtered = sorted.filter(inv => statusFilter==='all' || inv.status===statusFilter);
        const totalPaid = invoices.filter(i=> i.status==='paid').reduce((s,i)=> s + Number(i.amount||0),0);
        const badgeClass = (status) => status === 'paid' ? 'bg-emerald-100 text-emerald-700' : status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
        const downloadCSV = () => {
            const rows = [['Invoice ID','Date','Amount','Status']].concat(invoices.map(i=>[i.id,new Date(i.date).toISOString(),i.amount,i.status]));
            const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], {type:'text/csv'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click(); URL.revokeObjectURL(url);
        };
        return (
            <div id="billing-section" className="glassmorphism rounded-2xl p-8 border border-white/20 bg-white">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mr-auto">Billing & Invoices</h2>
                    <label className="text-sm flex items-center gap-2">Status: <select className="border rounded p-1" value={statusFilter} onChange={e=> setStatusFilter(e.target.value)}><option value="all">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option></select></label>
                    <button onClick={refetchInvoices} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" disabled={invoiceLoading}>Refresh</button>
                    <button onClick={downloadCSV} className="text-sm px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800">Export CSV</button>
                </div>
                {invoiceLoading && <div className="py-6 text-sm text-gray-500">Loading invoices...</div>}
                {invoiceError && !invoiceLoading && <div className="py-4 text-sm text-red-600">{invoiceError}</div>}
                {!invoiceLoading && !invoiceError && filtered.length === 0 && <div className="py-8 text-gray-500">No invoices match current filter.</div>}
                {!invoiceLoading && !invoiceError && filtered.length > 0 && (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">Invoice #</th>
                                    <th className="px-4 py-2 text-left">Amount</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv.id} className="odd:bg-white even:bg-gray-50 border-b last:border-0">
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{inv.id}</td>
                                        <td className="px-4 py-2 font-medium">${inv.amount}</td>
                                        <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${badgeClass(inv.status)}`}>{inv.status}</span></td>
                                        <td className="px-4 py-2 space-x-2">
                                            <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PDF</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 rounded-lg bg-gray-50 border"><p className="text-gray-500">Total Invoices</p><p className="text-xl font-bold text-gray-900">{invoices.length}</p></div>
                    <div className="p-4 rounded-lg bg-gray-50 border"><p className="text-gray-500">Outstanding Balance</p><p className="text-xl font-bold text-gray-900">${invoiceOutstanding.toFixed(2)}</p></div>
                    <div className="p-4 rounded-lg bg-gray-50 border"><p className="text-gray-500">Total Paid</p><p className="text-xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p></div>
                </div>
            </div>
        );
    };

    const OrdersSection = () => {
        const [statusFilter, setStatusFilter] = useState('all');
        const [typeFilter, setTypeFilter] = useState('all');
        const sorted = [...orders].sort((a,b)=> new Date(b.datePurchased)-new Date(a.datePurchased));
        const filtered = sorted.filter(o => (statusFilter==='all' || (o.status||'').toLowerCase() === statusFilter) && (typeFilter==='all' || o.kind === typeFilter));
        const exportCSV = () => {
            const rows = [['ID','Name','Type','Status','Date Purchased']].concat(sorted.map(o=> [o.id,o.name,o.kind,o.status,new Date(o.datePurchased).toISOString()]));
            const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='orders.csv'; a.click(); URL.revokeObjectURL(url);
        };
        return (
            <div id="orders-section" className="glassmorphism rounded-2xl p-8 border border-white/20 bg-white">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mr-auto">Orders</h2>
                    <label className="text-sm flex items-center gap-2">Type: <select className="border rounded p-1" value={typeFilter} onChange={e=> setTypeFilter(e.target.value)}><option value="all">All</option><option value="service">Services</option><option value="product">Products</option></select></label>
                    <label className="text-sm flex items-center gap-2">Status: <select className="border rounded p-1" value={statusFilter} onChange={e=> setStatusFilter(e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select></label>
                    <button onClick={exportCSV} className="text-sm px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800">Export CSV</button>
                </div>
                {filtered.length===0 && <div className="py-8 text-gray-500">No orders match current filters.</div>}
                {filtered.length>0 && (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Type</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Date Purchased</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(o => (
                                    <tr key={o.id} className="odd:bg-white even:bg-gray-50 border-b last:border-0">
                                        <td className="px-4 py-2 font-medium text-gray-800" title={o.name}>{o.name}</td>
                                        <td className="px-4 py-2 capitalize">{o.kind}</td>
                                        <td className="px-4 py-2"><span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold capitalize">{o.status || '—'}</span></td>
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(o.datePurchased).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <Header />
                <div className="p-8 space-y-8">
                    {activeSection === 'overview' && (
                        <>
                            <StatsGrid />
                            <QuickActions />
                            <RecentSections />
                        </>
                    )}
                    {activeSection === 'support' && <SupportSection />}
                    {activeSection === 'billing' && <BillingSection />}
                    {activeSection === 'orders' && <OrdersSection />}
                    {activeSection === 'info' && (
                        <div className="glassmorphism rounded-2xl p-8 border border-white/20 bg-white">
                            <h2 className="text-2xl font-bold mb-4 text-gray-900">More Info</h2>
                            <p className="text-gray-600">Additional information will be available here.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}