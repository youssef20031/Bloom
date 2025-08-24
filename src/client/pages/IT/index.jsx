import React, { useMemo, useState, useEffect, useRef } from 'react';
import './it.style.css';
import { LayoutDashboard, AlertTriangle, Server, Wrench, Users, Bell, Plus, Search, Download, Calendar, Activity as ActivityIcon, Thermometer, Droplet, Zap, Cloud, Shield, Wifi, WifiOff, CheckCircle2, X, Eye, Clock, AlertCircle, Flame } from 'lucide-react';
import socketService from '../../utils/socket.js';
import mqtt from "mqtt";

export default function ITDashboard() {
	const [activeTab, setActiveTab] = useState('Incidents');
	const [incidents, setIncidents] = useState([]);
	const [assets, setAssets] = useState([]);
	const [servers, setServers] = useState([]);
	const [changes, setChanges] = useState([]);
	const [users, setUsers] = useState([]);
	const [alerts, setAlerts] = useState([]);
	const [healthOverview, setHealthOverview] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const [realtimeAlerts, setRealtimeAlerts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadingStates, setLoadingStates] = useState({
		incidents: true,
		assets: true,
		services: true,
		health: true,
		users: true,
		alerts: true
	});
	const [errors, setErrors] = useState({});
	const alertSound = useRef(null);
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
			{ icon: Bell, title: 'Active Alerts', value: alerts.length },
			{ icon: Wrench, title: 'Change Requests', value: changes.length },
			{ icon: Server, title: 'Assets Inventory', value: assets.length },
			{ icon: LayoutDashboard, title: 'Servers', value: servers.length },
			{ icon: Users, title: 'Users', value: users.length }
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
	}, [incidents, alerts, changes, assets, servers, users, healthOverview]);
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
	// WebSocket connection and real-time functionality
	useEffect(() => {
		// Connect to WebSocket
		const socket = socketService.connect();
		
		// Set connection status
		setIsConnected(socketService.getConnectionStatus());
		
		// Join IT dashboard room
		socket.emit('join-it-dashboard');
		
		// Listen for connection status changes
		socket.on('connect', () => {
			setIsConnected(true);
			console.log('✅ Connected to WebSocket server');
		});
		
		socket.on('disconnect', () => {
			setIsConnected(false);
			console.log('❌ Disconnected from WebSocket server');
		});
		
		// Listen for new alerts
		socketService.onNewAlert((data) => {
			console.log('🚨 New alert received in IT Dashboard:', data);
			console.log('Alert data structure:', JSON.stringify(data, null, 2));
			
			setRealtimeAlerts(prev => {
				const updated = [data.alert, ...prev.slice(0, 9)]; // Keep last 10 alerts
				console.log('Updated realtime alerts:', updated.length);
				return updated;
			});
			setAlerts(prev => [data.alert, ...prev]); // Add to main alerts list
			
			// Play alert sound (optional)
			if (alertSound.current) {
				alertSound.current.play().catch(e => console.log('Could not play alert sound'));
			}
		});
		
		// Listen for alert updates
		socketService.onAlertUpdate((data) => {
			console.log('📝 Alert updated:', data);
			setAlerts(prev => prev.map(alert => 
				alert._id === data.alert._id ? data.alert : alert
			));
			setRealtimeAlerts(prev => prev.map(alert => 
				alert._id === data.alert._id ? data.alert : alert
			));
		});
		
		// Listen for alert resolutions
		socketService.onAlertResolved((data) => {
			console.log('✅ Alert resolved:', data);
			setAlerts(prev => prev.map(alert => 
				alert._id === data.alert._id ? data.alert : alert
			));
			setRealtimeAlerts(prev => prev.map(alert => 
				alert._id === data.alert._id ? data.alert : alert
			));
		});
		
		// Test the connection
		socketService.sendTestEvent({ 
			message: "Hello from IT Dashboard",
			timestamp: new Date().toISOString()
		});
		
		// Cleanup function
		return () => {
			socketService.disconnect();
		};
	}, []);

	// Fetch initial data
	useEffect(() => {
		const fetchWithErrorHandling = async (url, setter, label, stateKey) => {
			try {
				setLoadingStates(prev => ({ ...prev, [stateKey]: true }));
				setErrors(prev => ({ ...prev, [stateKey]: null }));
				
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				const data = await response.json();
				setter(data);
				console.log(`✅ Successfully loaded ${label}:`, data.length || 'N/A');
			} catch (error) {
				console.error(`❌ Failed to load ${label} from ${url}:`, error);
				setErrors(prev => ({ ...prev, [stateKey]: error.message }));
				// Set empty array as fallback to prevent UI crashes
				if (typeof setter === 'function') {
					setter([]);
				}
			} finally {
				setLoadingStates(prev => ({ ...prev, [stateKey]: false }));
			}
		};

		// Fetch all data with proper error handling
		const loadData = async () => {
			await Promise.all([
				fetchWithErrorHandling('/api/support-ticket', setIncidents, 'support tickets', 'incidents'),
				fetchWithErrorHandling('/api/datacenter', (data) => {
					setAssets(data);
					// Populate servers from datacenter assets
					setServers(data.filter(item => item.assetType === 'server'));
				}, 'datacenter assets', 'assets'),
				fetchWithErrorHandling('/api/service', setChanges, 'services', 'services'),
				fetchWithErrorHandling('/api/datacenter/health/overview', setHealthOverview, 'health overview', 'health'),
				fetchWithErrorHandling('/api/users', setUsers, 'users', 'users'),
				fetchWithErrorHandling('/api/alerts', setAlerts, 'alerts', 'alerts')
			]);
			
			setIsLoading(false);
		};
		
		loadData();
	}, []);
	// Search term state
	const [searchTerm, setSearchTerm] = useState('');
	// Filtered data based on search term
	const filteredIncidents = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return incidents.filter(i =>
			i._id.toLowerCase().includes(term) ||
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
	const filteredUsers = useMemo(() => {
		const term = searchTerm.toLowerCase();
		return users.filter(u =>
			u.name.toLowerCase().includes(term) ||
			u.email.toLowerCase().includes(term) ||
			u.role.toLowerCase().includes(term)
		);
	}, [users, searchTerm]);
	// Pagination state
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [currentPage, setCurrentPage] = useState(1);
	// Reset to first page when tab or rowsPerPage changes
	useEffect(() => setCurrentPage(1), [activeTab, rowsPerPage]);
	// Compute filtered data per tab
	const currentData = useMemo(() => {
		switch (activeTab) {
			case 'Incidents': return filteredIncidents;
			case 'Assets': return filteredAssets;
			case 'Servers': return filteredServers;
			case 'Changes': return filteredChanges;
			case 'Users': return filteredUsers;
			default: return [];
		}
	}, [activeTab, filteredIncidents, filteredAssets, filteredServers, filteredChanges, filteredUsers]);
	const totalRows = currentData.length;
	const maxPage = Math.ceil(totalRows / rowsPerPage) || 1;
	// Paginate rows for display
	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * rowsPerPage;
		return currentData.slice(start, start + rowsPerPage);
	}, [currentData, currentPage, rowsPerPage]);
	// Export current table data as CSV
	const exportCSV = () => {
		let headers = [], rows = [];
		if (activeTab === 'Incidents') {
			headers = ['Ticket ID','Issue','Priority','Status','Assignee','Updated'];
			rows = filteredIncidents.map(r => [
				r._id,
				r.issue,
				r.priority,
				r.status,
				r.supportAgentId?.name || '',
				new Date(r.history?.length ? r.history[r.history.length-1].timestamp : r.createdAt).toLocaleString()
			]);
		} else if (activeTab === 'Assets') {
			headers = ['Asset ID','Type','Location'];
			rows = filteredAssets.map(a => [
				a.assetId?.name || '',
				a.assetType,
				a.location
			]);
		} else if (activeTab === 'Servers') {
			headers = ['Server Name','Location','Temperature','PowerDraw','Last Reading'];
			rows = filteredServers.map(s => {
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
			rows = filteredChanges.map(c => [
				c.name,
				c.type,
				new Date(c.createdAt).toLocaleString(),
				new Date(c.updatedAt).toLocaleString()
			]);
		} else if (activeTab === 'Users') {
			headers = ['Name','Email','Role','Created'];
			rows = filteredUsers.map(u => [
				u.name,
				u.email,
				u.role,
				new Date(u.createdAt).toLocaleString()
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

	// Helper functions for alerts
	const createTestAlert = async () => {
		try {
			console.log('🧪 Creating test alert...');
			const response = await fetch('/api/alerts/test', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response.ok) {
				const result = await response.json();
				console.log('✅ Test alert created successfully:', result);
			} else {
				console.error('❌ Failed to create test alert:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('❌ Error creating test alert:', error);
		}
	};

	const createRandomTestAlert = async () => {
		try {
			console.log('🎲 Creating random test alert...');
			const response = await fetch('/api/alerts/test/random', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response.ok) {
				const result = await response.json();
				console.log('✅ Random test alert created successfully:', result);
			} else {
				console.error('❌ Failed to create random test alert:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('❌ Error creating random test alert:', error);
		}
	};

	const markAlertAsRead = async (alertId) => {
		try {
			const response = await fetch(`/api/alerts/${alertId}/read`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response.ok) {
				console.log('✅ Alert marked as read');
				// Also emit via WebSocket
				socketService.markAlertAsRead(alertId);
			}
		} catch (error) {
			console.error('❌ Error marking alert as read:', error);
		}
	};

	const resolveAlert = async (alertId) => {
		try {
			const response = await fetch(`/api/alerts/${alertId}/resolve`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (response.ok) {
				console.log('✅ Alert resolved');
			}
		} catch (error) {
			console.error('❌ Error resolving alert:', error);
		}
	};
	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="w-64 bg-primary text-white flex-shrink-0">
				<div className="p-6 text-2xl font-bold">BLOOM</div>
				<nav className="mt-8 space-y-2">
					{[
						{ icon: AlertTriangle, label: 'Incidents', id: 'Incidents' },
						{ icon: Server, label: 'Assets', id: 'Assets' },
						{ icon: Wrench, label: 'Changes', id: 'Changes' },
						{ icon: Users, label: 'Users', id: 'Users' }
					].map(({ icon: Icon, label, id }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={`w-full flex items-center px-4 py-3 text-white bg-primary hover:bg-primary-700 transition-colors duration-200 ${activeTab===id ? 'bg-primary-700 border-r-4 border-white' : ''}`}
						>
							<Icon className="w-5 h-5 mr-3" />
							<span className="font-medium">{label}</span>
						</button>
					))}
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
							
							{/* WebSocket Connection Status */}
							<div className="flex items-center space-x-2">
								{isConnected ? (
									<div className="flex items-center text-green-600 text-sm">
										<Wifi className="w-4 h-4 mr-1" />
										<span className="hidden md:inline">Live</span>
									</div>
								) : (
									<div className="flex items-center text-red-600 text-sm">
										<WifiOff className="w-4 h-4 mr-1" />
										<span className="hidden md:inline">Offline</span>
									</div>
								)}
							</div>

							{/* Test Alert Buttons */}
							<button 
								className="btn-quiet text-sm"
								onClick={createTestAlert}
								title="Create Test Alert"
							>
								<AlertTriangle className="w-4 h-4 mr-1" />
								Test Alert
							</button>
							
							<button 
								className="btn-quiet text-sm"
								onClick={createRandomTestAlert}
								title="Create Random Test Alert"
							>
								<ActivityIcon className="w-4 h-4 mr-1" />
								Random Alert
							</button>
							
							<button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> New Incident</button>
							
							{/* Notification Bell with Alert Count */}
							<div className="relative notification-bell">
								<Bell className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors duration-200" />
								{realtimeAlerts.length > 0 && (
									<span className="notification-count absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
										{realtimeAlerts.length > 9 ? '9+' : realtimeAlerts.length}
									</span>
								)}
							</div>
							
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

				{/* Loading and Error States */}
				{isLoading && (
					<div className="mt-6 bg-white p-8 rounded-lg shadow-md">
						<div className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
							<span className="text-gray-600">Loading dashboard data...</span>
						</div>
					</div>
				)}

				{/* Error Display */}
				{Object.keys(errors).some(key => errors[key]) && (
					<div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<h3 className="text-red-800 font-semibold mb-2">⚠️ Some data could not be loaded:</h3>
						<ul className="text-red-700 text-sm space-y-1">
							{Object.entries(errors).map(([key, error]) => 
								error && <li key={key}>• {key}: {error}</li>
							)}
						</ul>
					</div>
				)}

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
											<th>Ticket ID</th>
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
									{activeTab === 'Users' && (
										<tr>
											<th>Name</th>
											<th>Email</th>
											<th>Role</th>
											<th>Created</th>
										</tr>
									)}
								</thead>
								<tbody>
									{activeTab === 'Incidents' && paginatedData.map((row) => (
										<tr key={row._id}>
											<td>{row._id}</td>
											<td>{row.issue}</td>
											<td><span className={`badge ${priorityToClass(row.priority)}`}>{row.priority}</span></td>
											<td><span className={`badge ${statusToClass(row.status)}`}>{row.status}</span></td>
											<td>{row.supportAgentId?.name || 'Unassigned'}</td>
											<td>{row.history?.length ? new Date(row.history[row.history.length - 1].timestamp).toLocaleString() : new Date(row.createdAt).toLocaleString()}</td>
										</tr>
									))}
									{activeTab === 'Assets' && paginatedData.map((a) => (
										<tr key={a.id}>
											<td>{a.id}</td>
											<td>{a.type}</td>
											<td>{a.owner}</td>
											<td><span className={statusToClass(a.status)}>{a.status}</span></td>
											<td>{a.location}</td>
										</tr>
									))}
									{activeTab === 'Servers' && paginatedData.map((s) => {
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
									{activeTab === 'Changes' && paginatedData.map((c) => (
										<tr key={c._id}>
											<td>{c.name}</td>
											<td>{c.type}</td>
											<td>{new Date(c.createdAt).toLocaleString()}</td>
											<td>{new Date(c.updatedAt).toLocaleString()}</td>
										</tr>
									))}
									{activeTab === 'Users' && paginatedData.map((u) => (
										<tr key={u._id}>
											<td>{u.name}</td>
											<td>{u.email}</td>
											<td>{u.role}</td>
											<td>{new Date(u.createdAt).toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-4 flex items-center justify-between text-sm text-gray-600">
							<div className="flex items-center space-x-2">
								<span>Show</span>
								<select
									className="it-select"
									value={rowsPerPage}
									onChange={e => setRowsPerPage(Number(e.target.value))}
								>
									{[5,10,20].map(n => <option key={n} value={n}>{n}</option>)}
								</select>
								<span>rows</span>
							</div>
							<div className="space-x-2">
								<button
									className="btn-quiet"
									disabled={currentPage <= 1}
									onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
								>Prev</button>
								<button className="btn-primary btn-small" disabled>
									{currentPage} / {maxPage}
								</button>
								<button
									className="btn-quiet"
									disabled={currentPage >= maxPage}
									onClick={() => setCurrentPage(p => Math.min(p + 1, maxPage))}
								>Next</button>
							</div>
						</div>
					</div>

					{/* Right column: Real-time Alerts, Health & Activity */}
					<div className="space-y-6">
						{/* Real-time Alerts */}
						<div className="stat-card">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-gray-800 flex items-center">
								<Bell className="w-4 h-4 mr-2" />
								Live Alerts
								<span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
							</h3>
								{realtimeAlerts.length > 0 && (
									<div className="flex items-center space-x-2 text-xs">
										<span className="status-indicator status-new">
											{realtimeAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length} Critical
										</span>
										<span className="status-indicator status-acknowledged">
											{realtimeAlerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length} Warning
										</span>
									</div>
								)}
							</div>
							{realtimeAlerts.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
												<Bell className="w-6 h-6 text-gray-400" />
											</div>
											<p className="text-gray-500 text-sm font-medium">All clear!</p>
											<p className="text-gray-400 text-xs mt-1">No active alerts at the moment</p>
										</div>
									) : (
										<div className="space-y-3 max-h-96 overflow-y-auto alert-scroll">
											{realtimeAlerts.slice(0, 10).map((alert) => {
												const getAlertStyle = () => {
													if (alert.status === 'resolved') {
														return {
															border: 'border-l-4 border-green-400',
															bg: 'bg-green-50',
															text: 'text-green-800',
															subtext: 'text-green-600',
															icon: CheckCircle2
														};
													}
													if (alert.severity === 'critical') {
														return {
															border: 'border-l-4 border-red-500',
															bg: 'bg-red-50 ring-1 ring-red-200',
															text: 'text-red-900',
															subtext: 'text-red-700',
															icon: AlertTriangle
														};
													}
													return {
														border: 'border-l-4 border-amber-400',
														bg: 'bg-amber-50 ring-1 ring-amber-200',
														text: 'text-amber-900',
														subtext: 'text-amber-700',
														icon: AlertCircle
													};
												};

												const getTypeIcon = () => {
													switch (alert.type) {
														case 'temperature': return Thermometer;
														case 'humidity': return Droplet;
														case 'power': return Zap;
														case 'security': return Shield;
														case 'smoke': return Flame;
														default: return AlertTriangle;
													}
												};

												const style = getAlertStyle();
												const StatusIcon = style.icon;
												const TypeIcon = getTypeIcon();

																				return (
									<div 
										key={alert._id} 
										className={`${style.border} ${style.bg} rounded-lg p-4 alert-item transition-all duration-200 hover:shadow-md ${
											alert.status === 'resolved' ? 'severity-resolved' : 
											alert.severity === 'critical' ? 'severity-critical' : 'severity-warning'
										} ${!alert.read ? 'unread' : ''}`}
									>
														<div className="flex items-start space-x-3">
															<div className="flex-shrink-0">
																<div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
																	<TypeIcon className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
																</div>
															</div>
															<div className="flex-1 min-w-0">
																<div className="flex items-center justify-between">
																	<div className="flex items-center space-x-2">
																		<h4 className={`text-sm font-semibold ${style.text} truncate`}>
																			{alert.type?.charAt(0).toUpperCase() + alert.type?.slice(1)}
																		</h4>
																		<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
																			alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
																		}`}>
																			{alert.severity}
																		</span>
																	</div>
																	{alert.status === 'resolved' && (
																		<StatusIcon className="w-5 h-5 text-green-600" />
																	)}
																</div>
																<p className={`text-sm ${style.subtext} mt-1 leading-relaxed`}>
																	{alert.message}
																</p>
																<div className="flex items-center justify-between mt-3">
																	<div className="flex items-center text-xs text-gray-500">
																		<Clock className="w-3 h-3 mr-1" />
																		{new Date(alert.timestamp).toLocaleTimeString([], { 
																			hour: '2-digit', 
																			minute: '2-digit',
																			hour12: true
																		})}
												</div>
																	{alert.status !== 'resolved' && (
																		<div className="flex items-center space-x-2">
													{!alert.read && (
														<button 
															onClick={() => markAlertAsRead(alert._id)}
																					className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
															title="Mark as read"
														>
																					<Eye className="w-4 h-4" />
														</button>
													)}
														<button 
															onClick={() => resolveAlert(alert._id)}
																				className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
																				title="Resolve alert"
														>
																				<CheckCircle2 className="w-4 h-4" />
														</button>
																		</div>
													)}
												</div>
											</div>
														</div>
													</div>
												);
											})}
										</div>
							)}
						</div>

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


