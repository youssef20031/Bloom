import React, { useMemo, useState } from 'react';
import './it.style.css';
import { LayoutDashboard, AlertTriangle, Server, Wrench, Users, Bell, Plus, Search, Download, Calendar, Activity as ActivityIcon, HardDrive, Cloud, Shield } from 'lucide-react';

export default function ITDashboard() {
	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="w-64 bg-primary text-white flex-shrink-0">
				<div className="p-6 text-2xl font-bold">BLOOM</div>
				<nav className="mt-8">
					<a href="#" className="flex items-center px-6 py-3 text-gray-200 hover:bg-blue-800">
						<LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
					</a>
					<a href="#" className="flex items-center px-6 py-3 text-gray-200 hover:bg-blue-800">
						<AlertTriangle className="w-5 h-5 mr-3" /> Incidents
					</a>
					<a href="#" className="flex items-center px-6 py-3 text-gray-200 hover:bg-blue-800">
						<Server className="w-5 h-5 mr-3" /> Infrastructure
					</a>
					<a href="#" className="flex items-center px-6 py-3 text-gray-200 hover:bg-blue-800">
						<Wrench className="w-5 h-5 mr-3" /> Changes
					</a>
					<a href="#" className="flex items-center px-6 py-3 text-gray-200 hover:bg-blue-800">
						<Users className="w-5 h-5 mr-3" /> Users
					</a>
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
							<h1 className="text-3xl font-bold text-gray-800 mt-1">Welcome back,Ali Alooka</h1>
							<p className="text-gray-500">Operations overview and incident management</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="relative hidden md:block">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input className="it-input pl-9" placeholder="Search tickets, hosts, users" />
							</div>
							<button className="btn-secondary hidden sm:inline-flex"><Download className="w-4 h-4 mr-2" /> Export</button>
							<button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> New Incident</button>
							<Bell className="text-gray-500 hidden sm:block" />
							<img src="https://i.pravatar.cc/40?img=12" alt="User Avatar" className="w-10 h-10 rounded-full" />
						</div>
					</div>
				</header>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="stat-card kpi kpi-1">
						<div className="kpi-icon"><AlertTriangle className="w-5 h-5" /></div>
						<div>
							<h3 className="text-gray-600">Open Incidents</h3>
							<p className="text-3xl font-bold">14</p>
						</div>
					</div>
					<div className="stat-card kpi kpi-2">
						<div className="kpi-icon"><Wrench className="w-5 h-5" /></div>
						<div>
							<h3 className="text-gray-600">Change Requests</h3>
							<p className="text-3xl font-bold">6</p>
						</div>
					</div>
					<div className="stat-card kpi kpi-3">
						<div className="kpi-icon"><Server className="w-5 h-5" /></div>
						<div>
							<h3 className="text-gray-600">Server Uptime</h3>
							<p className="text-3xl font-bold text-green-600">99.96%</p>
						</div>
					</div>
					<div className="stat-card kpi kpi-4">
						<div className="kpi-icon"><LayoutDashboard className="w-5 h-5" /></div>
						<div>
							<h3 className="text-gray-600">Deployments Today</h3>
							<p className="text-3xl font-bold">3</p>
						</div>
					</div>
				</div>

				{/* Filters / Toolbar */}
				<div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div className="segmented">
						<button onClick={() => setActiveTab('Incidents')} className={`segment ${activeTab==='Incidents' ? 'active' : ''}`}>Incidents</button>
						<button onClick={() => setActiveTab('Assets')} className={`segment ${activeTab==='Assets' ? 'active' : ''}`}>Assets</button>
						<button onClick={() => setActiveTab('Servers')} className={`segment ${activeTab==='Servers' ? 'active' : ''}`}>Servers</button>
						<button onClick={() => setActiveTab('Users')} className={`segment ${activeTab==='Users' ? 'active' : ''}`}>Users</button>
						<button onClick={() => setActiveTab('Changes')} className={`segment ${activeTab==='Changes' ? 'active' : ''}`}>Changes</button>
					</div>
					{activeTab === 'Incidents' && (
						<div className="flex items-center gap-2">
							<button className="chip chip-active">All</button>
							<button className="chip">High</button>
							<button className="chip">Medium</button>
							<button className="chip">Low</button>
							<button className="btn-quiet hidden md:inline-flex"><Calendar className="w-4 h-4 mr-2" /> Last 7 days</button>
						</div>
					)}
				</div>

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
							<button className="btn-quiet"><Download className="w-4 h-4 mr-2" /> Export CSV</button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-left it-table">
								<thead>
									{activeTab === 'Incidents' && (
										<tr>
											<th>Ticket</th>
											<th>Priority</th>
											<th>Service</th>
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
											<th>Server</th>
											<th>Role</th>
											<th>CPU</th>
											<th>Memory</th>
											<th>Status</th>
										</tr>
									)}
									{activeTab === 'Changes' && (
										<tr>
											<th>Change ID</th>
											<th>Title</th>
											<th>Risk</th>
											<th>Status</th>
											<th>Scheduled</th>
										</tr>
									)}
								</thead>
								<tbody>
									{activeTab === 'Incidents' && incidents.map((row) => (
										<tr key={row.id}>
											<td>{row.id}</td>
											<td><span className={priorityToClass(row.priority)}>{row.priority}</span></td>
											<td>{row.service}</td>
											<td><span className={statusToClass(row.status)}>{row.status}</span></td>
											<td><div className="assignee"><img src={`https://i.pravatar.cc/24?img=${row.assignee.avatar}`} /><span>{row.assignee.name}</span></div></td>
											<td>{row.updated}</td>
										</tr>
									))}
									{activeTab === 'Assets' && assets.map((a) => (
										<tr key={a.id}>
											<td>{a.id}</td>
											<td>{a.type}</td>
											<td>{a.owner}</td>
											<td><span className={statusToClass(a.status)}>{a.status}</span></td>
											<td>{a.location}</td>
										</tr>
									))}
									{activeTab === 'Servers' && servers.map((s) => (
										<tr key={s.name}>
											<td>{s.name}</td>
											<td>{s.role}</td>
											<td>{s.cpu}</td>
											<td>{s.mem}</td>
											<td><span className={statusToClass(s.status)}>{s.status}</span></td>
										</tr>
									))}
									{activeTab === 'Changes' && changes.map((c) => (
										<tr key={c.id}>
											<td>{c.id}</td>
											<td>{c.title}</td>
											<td><span className={priorityToClass(c.risk)}>{c.risk}</span></td>
											<td><span className={statusToClass(c.status)}>{c.status}</span></td>
											<td>{c.scheduled}</td>
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
								<li className="health-item"><HardDrive className="w-4 h-4" /><span>Storage Cluster</span><span className="dot dot-green" /></li>
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


