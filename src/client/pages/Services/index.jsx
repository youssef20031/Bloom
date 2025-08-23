import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Bot, Grid, Loader2, Layers, Package, Server, X, ChevronDown, ChevronUp } from 'lucide-react';
import ChatBot from '../chatBot';
import CustomerSidebar from '../../components/CustomerSidebar.jsx';

const TYPE_LABEL = {
  ai_only: 'AI Only',
  ai_hosted: 'AI Hosted',
  infrastructure: 'Infrastructure'
};

export default function Services() {
  // Sidebar related state
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [customerDbId, setCustomerDbId] = useState(null);
  const [openTicketCount, setOpenTicketCount] = useState(0);

  // Mode & services
  const [mode, setMode] = useState('browse'); // 'browse' | 'chat'
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // Service selection state
  const [purchasedServiceIds, setPurchasedServiceIds] = useState([]);
  const [purchasingServiceId, setPurchasingServiceId] = useState(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState({}); // serviceId -> {status,message}

  // Load user
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { const u = JSON.parse(stored); setUserId(u._id || u.id); setUserName(u.name || 'User'); } catch { /* ignore */ }
    }
  }, []);

  // Fetch customer profile for DB id & tickets for badge
  useEffect(() => {
    if (!userId) return;
    let abort = false;
    const fetchProfileAndTickets = async () => {
      try {
        const profileRes = await fetch(`/api/customers/profile/${userId}`);
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (!abort) {
            setCustomerDbId(data._id);
            const ids = (data.purchasedServices || []).map(ps => ps.serviceId && ps.serviceId._id ? ps.serviceId._id : ps.serviceId);
            setPurchasedServiceIds(ids.filter(Boolean));
          }
        }
      } catch { /* ignore */ }
    };
    fetchProfileAndTickets();
    return () => { abort = true; };
  }, [userId]);

  // Fetch customer tickets
  useEffect(() => {
    if (!customerDbId) return;
    let abort = false;
    const fetchTickets = async () => {
      try {
        const res = await fetch(`/api/customers/tickets/${customerDbId}`);
        if (res.ok) {
          const data = await res.json();
          if (!abort) setOpenTicketCount(data.filter(t => (t.status||'').toLowerCase()==='open').length);
        }
      } catch { /* ignore */ }
    };
    fetchTickets();
    const id = setInterval(fetchTickets, 30000);
    return () => { abort = true; clearInterval(id); };
  }, [customerDbId]);

  // Fetch services
  useEffect(() => {
    let abort = false;
    const fetchServices = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch('/api/service');
        if (!res.ok) throw new Error('Failed to load services');
        const data = await res.json();
        if (!abort) setServices(Array.isArray(data) ? data : []);
      } catch (e) { if (!abort) setError(e.message); }
      finally { if (!abort) setLoading(false); }
    };
    fetchServices();
    return () => { abort = true; };
  }, []);

  const filtered = useMemo(() => services.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description||'').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesType;
  }), [services, search, typeFilter]);

  const types = useMemo(() => Array.from(new Set(services.map(s => s.type))), [services]);

  const handleLogout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

  const handleSelectService = async (svc) => {
    if (!customerDbId) {
      setPurchaseFeedback(prev => ({ ...prev, [svc._id]: { status: 'error', message: 'Customer not loaded yet.' } }));
      return;
    }
    if (purchasedServiceIds.includes(svc._id)) return;
    setPurchasingServiceId(svc._id);
    setPurchaseFeedback(prev => ({ ...prev, [svc._id]: { status: 'pending', message: 'Purchasing...' } }));
    try {
      const res = await fetch('/api/customers/add-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerDbId, serviceId: svc._id })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({message:'Failed'}));
        throw new Error(err.message || 'Purchase failed');
      }
      setPurchasedServiceIds(prev => [...prev, svc._id]);
      setPurchaseFeedback(prev => ({ ...prev, [svc._id]: { status: 'success', message: 'Service added successfully.' } }));
      try { localStorage.setItem('servicesUpdated', Date.now().toString()); } catch {}
    } catch (e) {
      setPurchaseFeedback(prev => ({ ...prev, [svc._id]: { status: 'error', message: e.message } }));
    } finally {
      setPurchasingServiceId(null);
      setTimeout(() => setPurchaseFeedback(prev => { const { [svc._id]:_, ...rest } = prev; return rest; }), 4000);
    }
  };

  const ServiceCard = ({ svc }) => {
    const isOpen = expandedId === svc._id;
    const purchased = purchasedServiceIds.includes(svc._id);
    const fb = purchaseFeedback[svc._id];
    return (
      <div className="group relative rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            {svc.type === 'infrastructure' ? <Server className="w-6 h-6" /> : svc.type === 'ai_hosted' ? <Layers className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-lg leading-tight truncate" title={svc.name}>{svc.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{TYPE_LABEL[svc.type] || svc.type}</span>
              {Array.isArray(svc.associatedProducts) && svc.associatedProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> {svc.associatedProducts.length} products</span>
              )}
            </div>
          </div>
          <button onClick={() => setExpandedId(isOpen ? null : svc._id)} className="p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition" aria-expanded={isOpen} aria-label={isOpen ? 'Collapse details' : 'Expand details'}>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        {isOpen && (
          <div className="mt-4 text-sm text-slate-600 animate-fade-in space-y-3">
            <p>{svc.description || 'No description provided.'}</p>
            {svc.hostingDetails && (svc.hostingDetails.datacenterLocation || svc.hostingDetails.vmSpecs) && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Hosting Details</h4>
                {svc.hostingDetails.datacenterLocation && <p className="text-xs"><span className="font-medium">Location:</span> {svc.hostingDetails.datacenterLocation}</p>}
                {svc.hostingDetails.vmSpecs && <pre className="mt-2 text-[11px] leading-snug bg-white rounded p-2 border overflow-x-auto">{JSON.stringify(svc.hostingDetails.vmSpecs, null, 2)}</pre>}
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium shadow focus:outline-none focus:ring flex items-center gap-2 ${purchased ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${purchasingServiceId===svc._id ? 'opacity-70' : ''}`}
                disabled={purchased || purchasingServiceId===svc._id}
                onClick={() => handleSelectService(svc)}
              >
                {purchased ? 'Selected' : purchasingServiceId===svc._id ? 'Selecting...' : 'Select'}
              </button>
              <button className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium focus:outline-none focus:ring focus:ring-slate-300" onClick={() => setMode('chat')}>Ask AI About This</button>
              {fb && (
                <span className={`text-xs ${fb.status==='success' ? 'text-emerald-600' : fb.status==='error' ? 'text-red-600' : 'text-slate-500'}`}>{fb.message}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <CustomerSidebar userName={userName} openTicketCount={openTicketCount} current="services" onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-40">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Solutions & Services</h1>
              <p className="text-sm text-slate-500 mt-1">Browse curated solutions or consult the AI assistant.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${mode==='browse' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'}`}><Grid className="w-4 h-4" /> Browse</button>
              <button onClick={() => setMode('chat')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${mode==='chat' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'}`}><Bot className="w-4 h-4" /> AI Assistant</button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl w-full mx-auto px-6 py-8">
          {mode === 'browse' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white/60 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm" />
                  {search && <button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white/60 backdrop-blur px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                    <option value="all">All Types</option>
                    {types.map(t => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
                  </select>
                </div>
              </div>
              {loading && (<div className="flex items-center justify-center py-24 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading services...</div>)}
              {error && !loading && (<div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>)}
              {!loading && !error && filtered.length === 0 && (<div className="text-center py-24 text-slate-500 text-sm">No services match your criteria.</div>)}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(svc => <ServiceCard key={svc._id} svc={svc} />)}
              </div>
            </div>
          )}
          {mode === 'chat' && (
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Bot className="w-5 h-5 text-blue-600" /> AI Solution Assistant</h2>
                <button onClick={()=>setMode('browse')} className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600">Back to Browse</button>
              </div>
              <div className="border rounded-xl overflow-hidden h-[70vh] bg-white">
                <ChatBot />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}