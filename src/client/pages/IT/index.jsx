import React, { useMemo, useState, useEffect } from 'react';
import './it.style.css';
import { LayoutDashboard, AlertTriangle, Server, Wrench, Users, Bell, Plus, Search, Download, Calendar, Activity as ActivityIcon, Thermometer, Droplet, Zap, Cloud, Shield } from 'lucide-react';

export default function ITDashboard() {
	const [activeTab, setActiveTab] = useState('Incidents');
	const [incidents, setIncidents] = useState([]);
	const [assets, setAssets] = useState([]);
	const [servers, setServers] = useState([]);
	const [changes, setChanges] = useState([]);
	const [healthOverview, setHealthOverview] = useState(null);
	// Prepare dynamic health metrics array
	const healthMetrics = useMemo(() => {
		if (!healthOverview) return [];
		return [
			{ title: 'Total Assets', value: healthOverview.totalAssets },
			{ title: 'Avg Temperature', value: healthOverview.averages.temperature },
			{ title: 'Avg Humidity', value: healthOverview.averages.humidity },
			{ title: 'Avg Power Draw', value: healthOverview.averages.powerDraw }
		];
	}, [healthOverview]);
	// Prepare KPI cards dynamically
	const kpiMetrics = useMemo(() => {
		const base = [
			{ icon: AlertTriangle, title: 'Open Incidents', value: incidents.filter(i => i.status === 'open').length },
			{ icon: Wrench, title: 'Change Requests', value: changes.length },
			{ icon: Server, title: 'Assets Inventory', value: assets.length },
			{ icon: LayoutDashboard, title: 'Servers', value: servers.length }
		];
		if (healthOverview) {
			if (healthOverview.averages.temperature != null) {
				base.push({ icon: Thermometer, title: 'Avg Temp', value: `${healthOverview.averages.temperature}°C` });
			}
			if (healthOverview.averages.humidity != null) {
				base.push({ icon: Droplet, title: 'Avg Humidity', value: `${healthOverview.averages.humidity}%` });
			}
			if (healthOverview.averages.powerDraw != null) {
				base.push({ icon: Zap, title: 'Avg Power', value: `${healthOverview.averages.powerDraw}W` });
			}
		}
		return base;
	}, [incidents, changes, assets, servers, healthOverview]);
	const priorityToClass = (priority) => {
		switch (priority) {
			case 'high': return 'badge-red';
			case 'medium': return 'badge-yellow';
			case 'low': return 'badge-green';
			default: return 'badge-gray';
		}
	};
	const statusToClass = (status) => {
		switch (status) {
			case 'open': return 'badge-gray';
			case 'in_progress': return 'badge-orange';
			case 'closed': return 'badge-green';
			default: return 'badge-gray';
		}
	};
	useEffect(() => {
		fetch('/api/support-ticket')
			.then(res => res.json())
			.then(data => setIncidents(data))
			.catch(err => console.error(err));
		fetch('/api/datacenter')
			.then(res => res.json())
			.then(data => {
				setAssets(data);
				// Populate servers from datacenter assets
				setServers(data.filter(item => item.assetType === 'server'));
			})
			.catch(err => console.error(err));
		// Fetch change requests (services) as change items
		fetch('/api/service')
			.then(res => res.json())
			.then(data => setChanges(data))
			.catch(err => console.error(err));
		fetch('/api/datacenter/health/overview')
			.then(res => res.json())
			.then(data => setHealthOverview(data))
			.catch(err => console.error(err));
	}, []);
	// Search term state
	const [searchTerm, setSearchTerm] = useState('');
	// Filtered data based on search term
	const filteredIncidents = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return incidents.filter(i =>
			i.issue.toLowerCase().includes(term) ||
			(i.supportAgentId?.name || '').toLowerCase().includes(term)
		);
	}, [incidents, searchTerm]);
	const filteredAssets = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return assets.filter(a =>
			(a.assetId?.name || '').toLowerCase().includes(term) ||
			a.assetType.toLowerCase().includes(term) ||
			(a.location || '').toLowerCase().includes(term)
		);
	}, [assets, searchTerm]);
	const filteredServers = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return servers.filter(s =>
			(s.assetId?.name || '').toLowerCase().includes(term) ||
			(s.location || '').toLowerCase().includes(term)
		);
	}, [servers, searchTerm]);
	const filteredChanges = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return changes.filter(c =>
			c.name.toLowerCase().includes(term) ||
			c.type.toLowerCase().includes(term)
		);
	}, [changes, searchTerm]);
	// Export current table data as CSV
	const exportCSV = () => {
		let headers = [], rows = [];
		if (activeTab === 'Incidents') {
			headers = ['Issue','Priority','Status','Assignee','Updated'];
			rows = incidents.map(r => [
				r.issue,
				r.priority,
				r.status,
				r.supportAgentId?.name || '',
				new Date(r.history?.length ? r.history[r.history.length-1].timestamp : r.createdAt).toLocaleString()
			]);
		} else if (activeTab === 'Assets') {
			headers = ['Asset ID','Type','Owner','Status','Location'];
			rows = assets.map(a => [a.id, a.type, a.owner, a.status, a.location]);
		} else if (activeTab === 'Servers') {
			headers = ['Server Name','Location','Temperature','PowerDraw','Last Reading'];
			rows = servers.map(s => {
				const lr = s.latestReading || {};
				return [
					s.assetId?.name || '',
					s.location,
					lr.temperature ?? '',
					lr.powerDraw ?? '',
					lr.timestamp ? new Date(lr.timestamp).toLocaleString() : ''
				];
			});
		} else if (activeTab === 'Changes') {
			headers = ['Service Name','Type','Created','Updated'];
			rows = changes.map(c => [
				c.name,
				c.type,
				new Date(c.createdAt).toLocaleString(),
				new Date(c.updatedAt).toLocaleString()
			]);
		}
		const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', `${activeTab}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="w-64 bg-primary text-white flex-shrink-0">
				<div className="p-6 text-2xl font-bold">BLOOM</div>
				<nav className="mt-8">
					<button type="button" onClick={() => setActiveTab('Incidents')} className={`flex items-center px-6 py-3 w-full text-left text-gray-200 hover:bg-blue-800 ${activeTab==='Incidents'?'bg-blue-900':''}`}>
						<LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
					</button>
					<button type="button" onClick={() => setActiveTab('Incidents')} className={`flex items-center px-6 py-3 w-full text-left text-gray-200 hover:bg-blue-800 ${activeTab==='Incidents'?'bg-blue-900':''}`}>
						<AlertTriangle className="w-5 h-5 mr-3" /> Incidents
					</button>
					<button type="button" onClick={() => setActiveTab('Servers')} className={`flex items-center px-6 py-3 w-full text-left text-gray-200 hover:bg-blue-800 ${activeTab==='Servers'?'bg-blue-900':''}`}>
						<Server className="w-5 h-5 mr-3" /> Infrastructure
					</button>
					<button type="button" onClick={() => setActiveTab('Changes')} className={`flex items-center px-6 py-3 w-full text-left text-gray-200 hover:bg-blue-800 ${activeTab==='Changes'?'bg-blue-900':''}`}>
						<Wrench className="w-5 h-5 mr-3" /> Changes
					</button>
					<button type="button" onClick={() => setActiveTab('Users')} className={`flex items-center px-6 py-3 w-full text-left text-gray-200 hover:bg-blue-800 ${activeTab==='Users'?'bg-blue-900':''}`}>
						<Users className="w-5 h-5 mr-3" /> Users
					</button>
				</nav>
			</aside>

			{/* Main Content */}
			<main className="flex-1 p-8 overflow-y-auto bg-gray-50">
				<header className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<nav className="breadcrumb text-sm text-gray-500">
								<span>Home</span>
								<span>/</span>
								<span>IT</span>
								<span>/</span>
								<strong>Dashboard</strong>
							</nav>
							<h1 className="text-3xl font-bold text-gray-800 mt-1">Welcome back,IT member</h1>
							<p className="text-gray-500">Operations overview and incident management</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="relative w-full md:w-1/3">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
								<input
									type="text"
									className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
									placeholder="Search tickets, hosts, servers, services..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
								/>
							</div>
							<button className="btn-quiet" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</button>
							<button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> New Incident</button>
							<Bell className="text-gray-500 hidden sm:block" />
							<img src="https://i.pravatar.cc/40?img=12" alt="User Avatar" className="w-10 h-10 rounded-full" />
						</div>
					</div>
				</header>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{kpiMetrics.map(({ icon: Icon, title, value }, idx) => (
						<div className={`stat-card kpi kpi-${idx + 1}`} key={title}>
							<div className="kpi-icon"><Icon className="w-5 h-5" /></div>
							<div>
								<h3 className="text-gray-600">{title}</h3>
								<p className="text-3xl font-bold">{value}</p>
							</div>
						</div>
					))}
				</div>
				{/* Removed filters/toolbar under metrics for a cleaner layout */}

				{/* Content Grid */}
				<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Table */}
					<div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-800">
								{activeTab === 'Incidents' && 'Open Incident Tickets'}
								{activeTab === 'Assets' && 'Assets Inventory'}
								{activeTab === 'Servers' && 'Server Fleet'}
								{activeTab === 'Users' && 'Users'}
								{activeTab === 'Changes' && 'Change Requests'}
							</h2>
							<button className="btn-quiet" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-left it-table">
								<thead>
									{activeTab === 'Incidents' && (
										<tr>
											<th>Issue</th>
											<th>Priority</th>
											<th>Status</th>
											<th>Assignee</th>
											<th>Updated</th>
										</tr>
									)}
									{activeTab === 'Assets' && (
										<tr>
											<th>Asset ID</th>
											<th>Type</th>
											<th>Owner</th>
											<th>Status</th>
											<th>Location</th>
										</tr>
									)}
									{activeTab === 'Servers' && (
										<tr>
											<th>Server Name</th>
											<th>Location</th>
											<th>Temperature</th>
											<th>Power Draw</th>
											<th>Last Reading</th>
										</tr>
									)}
									{activeTab === 'Changes' && (
										<tr>
											<th>Service Name</th>
											<th>Type</th>
											<th>Created</th>
											<th>Updated</th>
										</tr>
									)}
								</thead>
								<tbody>
									{activeTab === 'Incidents' && filteredIncidents.map((row) => (
										<tr key={row._id}>
											<td>{row.issue}</td>
											<td><span className={priorityToClass(row.priority)}>{row.priority}</span></td>
											<td><span className={statusToClass(row.status)}>{row.status}</span></td>
											<td>{row.supportAgentId?.name || 'Unassigned'}</td>
											<td>{row.history?.length ? new Date(row.history[row.history.length - 1].timestamp).toLocaleString() : new Date(row.createdAt).toLocaleString()}</td>
										</tr>
									))}
									{activeTab === 'Assets' && filteredAssets.map((a) => (
										<tr key={a.id}>
											<td>{a.id}</td>
											<td>{a.type}</td>
											<td>{a.owner}</td>
											<td><span className={statusToClass(a.status)}>{a.status}</span></td>
											<td>{a.location}</td>
										</tr>
									))}
									{activeTab === 'Servers' && filteredServers.map((s) => {
										const { assetId, location, latestReading } = s;
										return (
										<tr key={s._id}>
											<td>{assetId?.name || s._id}</td>
											<td>{location}</td>
											<td>{latestReading?.temperature ?? '-'}</td>
											<td>{latestReading?.powerDraw ?? '-'}</td>
											<td>{latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleString() : '-'}</td>
										</tr>
										);
									})}
									{activeTab === 'Changes' && filteredChanges.map((c) => (
										<tr key={c._id}>
											<td>{c.name}</td>
											<td>{c.type}</td>
											<td>{new Date(c.createdAt).toLocaleString()}</td>
											<td>{new Date(c.updatedAt).toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-4 flex items-center justify-between text-sm text-gray-600">
							<div className="flex items-center space-x-2">
								<span>Show</span>
								<select className="it-select">
									<option>5</option>
									<option>10</option>
									<option>20</option>
								</select>
								<span>rows</span>
							</div>
							<div className="space-x-2">
								<button className="btn-quiet">Prev</button>
								<button className="btn-primary btn-small">1</button>
								<button className="btn-quiet">2</button>
								<button className="btn-quiet">Next</button>
							</div>
						</div>
					</div>

					{/* Right column: Health & Activity */}
					<div className="space-y-6">
						<div className="stat-card">
							<h3 className="font-semibold text-gray-800 mb-4">System Health</h3>
							<ul className="space-y-3">
								<li className="health-item"><Thermometer className="w-4 h-4" /><span>Storage Cluster</span><span className="dot dot-green" /></li>
								<li className="health-item"><Cloud className="w-4 h-4" /><span>Networking</span><span className="dot dot-yellow" /></li>
								<li className="health-item"><Shield className="w-4 h-4" /><span>Security</span><span className="dot dot-green" /></li>
								<li className="health-item"><Server className="w-4 h-4" /><span>Compute</span><span className="dot dot-red" /></li>
							</ul>
						</div>
						<div className="stat-card">
							<h3 className="font-semibold text-gray-800 mb-4">Upcoming Maintenance</h3>
							<ul className="timeline">
								<li>
									<span className="time">Tonight 01:00</span>
									<span>Storage nodes firmware update</span>
								</li>
								<li>
									<span className="time">Fri 23:00</span>
									<span>Core switch reload (maintenance window)</span>
								</li>
								<li>
									<span className="time">Next Tue</span>
									<span>Patch cycle for app servers</span>
								</li>
							</ul>
						</div>
						<div className="stat-card">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center"><ActivityIcon className="w-4 h-4 mr-2" /> Recent Activity</h3>
							<ul className="activity">
								<li><span className="dot dot-blue" /> Deployed version 1.8.3 to production</li>
								<li><span className="dot dot-green" /> Closed incident INC-1017</li>
								<li><span className="dot dot-yellow" /> Change request CHG-56 pending approval</li>
							</ul>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}


