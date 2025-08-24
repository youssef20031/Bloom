import React, { useMemo, useState, useEffect, useRef } from 'react';
import './it.style.css';
import { LayoutDashboard, AlertTriangle, Server, Wrench, Users, Bell, Plus, Search, Download, Calendar, Activity as ActivityIcon, Thermometer, Droplet, Zap, Cloud, Shield, Wifi, WifiOff, CheckCircle2, X, Eye, Clock, AlertCircle, Flame } from 'lucide-react';
import socketService from '../../utils/socket.js';
import mqtt from "mqtt";

// ====== 🔧 MQTT Configuration for Live Sensors ======
const BROKER_URL = "wss://c2e0fd901fdb464e8b397971387b99f7.s1.eu.hivemq.cloud:8884/mqtt";
const USERNAME = "seiff";
const PASSWORD = "Seif1234";
const TOPIC = "ESP32/sensors1";
const TOPIC2 = "ESP32/sensors2";
const STALE_AFTER_MS = 5000;

// Connection timeout settings
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Sensor thresholds for automatic alerts
const SENSOR_THRESHOLDS = {
	temperature: { min: 18, max: 30, critical: 35 }, // Celsius
	humidity: { min: 30, max: 70, critical: 80 }, // Percentage
	smoke: { max: 300, critical: 500 }, // Sensor units
	power: { min: 3.0, max: 5.2, critical: 5.5 } // Volts
};

// Helper function to coerce numbers that might arrive as strings
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// Utility Components with validation
const StatusBadge = ({ status = '', type = 'status' }) => {
	// Validate inputs
	if (!status || typeof status !== 'string') {
		console.warn('StatusBadge: status prop is required and must be a string');
		return <span className="badge badge-gray">N/A</span>;
	}

	const getClass = () => {
		if (type === 'priority') {
			switch (status.toLowerCase()) {
				case 'high': return 'badge-red';
				case 'medium': return 'badge-yellow';
				case 'low': return 'badge-green';
				default: return 'badge-gray';
			}
		}
		switch (status.toLowerCase()) {
			case 'open': return 'badge-gray';
			case 'in_progress': return 'badge-orange';
			case 'closed': case 'resolved': return 'badge-green';
			default: return 'badge-gray';
		}
	};
	
	return <span className={`badge ${getClass()}`}>{status}</span>;
};

const ConnectionIndicator = ({ isConnected = false, label = '', icon: Icon = null }) => {
	// Validate inputs
	if (!Icon || typeof Icon !== 'function') {
		console.warn('ConnectionIndicator: icon prop is required and must be a valid component');
		return null;
	}
	
	if (!label || typeof label !== 'string') {
		console.warn('ConnectionIndicator: label prop is required and must be a string');
		return null;
	}

	return (
		<div className="flex items-center space-x-2">
			<div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'} text-sm`}>
				<Icon className="w-4 h-4 mr-1" />
				<span className="hidden md:inline">{label}</span>
			</div>
		</div>
	);
};

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
	const [recentAlertHistory, setRecentAlertHistory] = useState(new Set()); // Track recent alerts to prevent spam
	const [debugMode, setDebugMode] = useState(false); // Debug mode toggle
	const alertSound = useRef(null);
	
	// IoT Dashboard States (from test.jsx)
	const [iotReadings, setIotReadings] = useState({
		esp1: null,
		esp2: null,
	});
	const [iotAverages, setIotAverages] = useState({
		temperature: 0,
		humidity: 0,
		smoke: 0,
		power: 0,
	});
	
	// MQTT Live Sensor States
	const mqttClientRef = useRef(null);
	const [mqttStatus, setMqttStatus] = useState("Connecting…");
	const [lastSensorUpdate, setLastSensorUpdate] = useState(null);
	const [mqttError, setMqttError] = useState("");
	const [liveSensors, setLiveSensors] = useState({
		temperature: null,
		humidity: null,
		proximity: null,
		smoke1: null,
		smoke2: null,
	});
	
	// Check if sensor data is stale
	const isSensorDataStale = useMemo(() => {
		if (!lastSensorUpdate) return true;
		return Date.now() - lastSensorUpdate > STALE_AFTER_MS;
	}, [lastSensorUpdate]);

	// Function to check sensor values against thresholds and generate alerts
	const checkSensorThresholds = (sensorData, nodeId) => {
		const alerts = [];
		const timestamp = new Date().toISOString();
		
		Object.entries(sensorData).forEach(([sensor, value]) => {
			if (value === null || isNaN(value)) return;
			
			const thresholds = SENSOR_THRESHOLDS[sensor];
			if (!thresholds) return;
			
			// Create unique alert key to prevent spam
			const alertKey = `${nodeId}-${sensor}-${Date.now()}`;
			
			// Skip if we've already alerted for this sensor recently (within 30 seconds)
			const recentAlertKey = `${nodeId}-${sensor}`;
			const now = Date.now();
			const lastAlertTime = localStorage.getItem(`lastAlert-${recentAlertKey}`);
			if (lastAlertTime && (now - parseInt(lastAlertTime)) < 30000) {
				return; // Skip to prevent alert spam
			}
			
			let alertData = null;
			
			// Check critical thresholds first
			if (thresholds.critical && value >= thresholds.critical) {
				alertData = {
					_id: alertKey,
					type: sensor,
					severity: 'critical',
					status: 'new',
					read: false,
					message: `Critical ${sensor} level detected on ${nodeId}: ${value}${getUnitForSensor(sensor)} (Critical: ≥${thresholds.critical})`,
					source: nodeId,
					value: value,
					threshold: thresholds.critical,
					timestamp: timestamp,
					createdAt: timestamp
				};
			}
			// Check high thresholds
			else if (thresholds.max && value > thresholds.max) {
				alertData = {
					_id: alertKey,
					type: sensor,
					severity: 'warning',
					status: 'new',
					read: false,
					message: `High ${sensor} detected on ${nodeId}: ${value}${getUnitForSensor(sensor)} (Max: ${thresholds.max})`,
					source: nodeId,
					value: value,
					threshold: thresholds.max,
					timestamp: timestamp,
					createdAt: timestamp
				};
			}
			// Check low thresholds
			else if (thresholds.min && value < thresholds.min) {
				alertData = {
					_id: alertKey,
					type: sensor,
					severity: 'warning',
					status: 'new',
					read: false,
					message: `Low ${sensor} detected on ${nodeId}: ${value}${getUnitForSensor(sensor)} (Min: ${thresholds.min})`,
					source: nodeId,
					value: value,
					threshold: thresholds.min,
					timestamp: timestamp,
					createdAt: timestamp
				};
			}
			
			if (alertData) {
				alerts.push(alertData);
				// Store the alert time to prevent spam
				localStorage.setItem(`lastAlert-${recentAlertKey}`, now.toString());
			}
		});
		
		return alerts;
	};

	// Helper function to get unit for sensor type
	const getUnitForSensor = (sensor) => {
		switch (sensor) {
			case 'temperature': return '°C';
			case 'humidity': return '%';
			case 'power': return 'V';
			case 'smoke': return '';
			default: return '';
		}
	};
	// Prepare dynamic health metrics array (excluding sensor averages as they're shown in IoT section)
	const healthMetrics = useMemo(() => {
		if (!healthOverview) return [];
		return [
			{ title: 'Total Assets', value: healthOverview.totalAssets }
		];
	}, [healthOverview]);
	// Prepare KPI cards dynamically with null safety
	const kpiMetrics = useMemo(() => {
		const base = [
			{ icon: AlertTriangle, title: 'Open Incidents', value: Array.isArray(incidents) ? incidents.filter(i => i?.status === 'open').length : 0 },
			{ icon: Wrench, title: 'Change Requests', value: Array.isArray(changes) ? changes.length : 0 },
			{ icon: Users, title: 'Users', value: Array.isArray(users) ? users.length : 0 }
		];
		
		// Add live sensor status indicator if available
		if (liveSensors.temperature !== null && !isNaN(liveSensors.temperature) && !isSensorDataStale) {
			base.push({ 
				icon: Thermometer, 
				title: 'Live Sensors', 
				value: 'Active',
				isLive: true,
				status: mqttStatus
			});
		}
		
		return base;
	}, [incidents, alerts, changes, assets, servers, users, healthOverview, liveSensors, isSensorDataStale, mqttStatus]);

	// MQTT Connection for Live Sensors
	useEffect(() => {
		// Connection timeout handling
		const connectionTimer = setTimeout(() => {
			if (mqttStatus === "Connecting…") {
				setMqttStatus("Connection Timeout ⏰");
				setMqttError("Failed to connect to MQTT broker within timeout period");
			}
		}, CONNECTION_TIMEOUT);
		
		// Create MQTT client for live sensor data
		const mqttClient = mqtt.connect(BROKER_URL, {
			username: USERNAME,
			password: PASSWORD,
			clientId: "it_dashboard_" + Math.random().toString(16).slice(2, 10),
			keepalive: 60,
			reconnectPeriod: 2000,
			connectTimeout: CONNECTION_TIMEOUT,
			clean: true,
			protocolVersion: 4, // Use MQTT 3.1.1
		});
		
		mqttClientRef.current = mqttClient;
		
		mqttClient.on("connect", () => {
			setMqttStatus("Connected ✅");
			setMqttError("");
			clearTimeout(connectionTimer);
			console.log("🌡️ Connected to MQTT broker for live sensors");
					mqttClient.subscribe(TOPIC, (err) => {
			if (err) {
				setMqttError("Subscribe error: " + err.message);
				console.error("MQTT subscribe error:", err);
			} else {
				console.log(`✅ Successfully subscribed to ${TOPIC}`);
			}
		});
		mqttClient.subscribe(TOPIC2, (err) => {
			if (err) {
				setMqttError("ESP2 Subscribe error: " + err.message);
				console.error("ESP2 MQTT subscribe error:", err);
			} else {
				console.log(`✅ Successfully subscribed to ${TOPIC2}`);
			}
		});
		});
		
		mqttClient.on("reconnect", () => setMqttStatus("Reconnecting…"));
		mqttClient.on("offline", () => setMqttStatus("Offline ❌"));
		mqttClient.on("close", () => setMqttStatus("Closed"));
		mqttClient.on("error", (err) => {
			const errorMessage = err?.message || String(err);
			setMqttError(errorMessage);
			setMqttStatus("Connection Error ❌");
			setErrors(prev => ({ ...prev, mqtt: `MQTT connection failed: ${errorMessage}` }));
			console.error("MQTT error:", err);
		});
		
		mqttClient.on("message", (topic, payload) => {
			try {
				const raw = payload.toString("utf8");
				const clean = raw.replace(/\u00A0/g, " ").trim();
				const sensorData = JSON.parse(clean);
				
				// Handle ESP32/sensors topic (ESP1 data)
				if (topic === TOPIC) {
					const processedData = {
						temperature: toNum(sensorData.temperature),
						humidity: toNum(sensorData.humidity),
						proximity: toNum(sensorData.proximity),
						smoke1: toNum(sensorData.smoke1),
						smoke2: toNum(sensorData.smoke2),
					};

					setLiveSensors(processedData);
					setLastSensorUpdate(Date.now());
					
					// Map to ESP1 format for IoT dashboard
					const esp1Data = {
						temperature: processedData.temperature,
						humidity: processedData.humidity,
						smoke: processedData.smoke1,
						power: processedData.proximity,
					};

					setIotReadings((prev) => ({
						...prev,
						esp1: esp1Data
					}));

					// Check thresholds and generate alerts
					const generatedAlerts = checkSensorThresholds(esp1Data, 'ESP-01');
					if (generatedAlerts.length > 0) {
						generatedAlerts.forEach(alert => {
							// Add to realtime alerts
							setRealtimeAlerts(prev => [alert, ...prev.slice(0, 9)]);
							setAlerts(prev => [alert, ...prev]);
							
							// Emit via WebSocket if connected
							if (isConnected) {
								socketService.sendTestEvent({
									type: 'sensor_alert',
									alert: alert,
									timestamp: new Date().toISOString()
								});
							}
							
							// Play alert sound
							if (alertSound.current) {
								alertSound.current.play().catch(e => console.log('Could not play alert sound'));
							}
							
							console.log('🚨 Auto-generated sensor alert:', alert);
						});
					}
					
					console.log("📊 ESP1 sensor data updated:", sensorData);
				}
				
				// Handle ESP32/sensors2 topic (ESP2 data)
				if (topic === TOPIC2) {
					// Map to ESP2 format for IoT dashboard
					const esp2Data = {
						temperature: toNum(sensorData.temperature),
						humidity: toNum(sensorData.humidity),
						smoke: toNum(sensorData.smoke1 || sensorData.smoke),
						power: toNum(sensorData.proximity || sensorData.power),
					};

					setIotReadings((prev) => ({
						...prev,
						esp2: esp2Data
					}));

					// Check thresholds and generate alerts for ESP2
					const generatedAlerts = checkSensorThresholds(esp2Data, 'ESP-02');
					if (generatedAlerts.length > 0) {
						generatedAlerts.forEach(alert => {
							// Add to realtime alerts
							setRealtimeAlerts(prev => [alert, ...prev.slice(0, 9)]);
							setAlerts(prev => [alert, ...prev]);
							
							// Emit via WebSocket if connected
							if (isConnected) {
								socketService.sendTestEvent({
									type: 'sensor_alert',
									alert: alert,
									timestamp: new Date().toISOString()
								});
							}
							
							// Play alert sound
							if (alertSound.current) {
								alertSound.current.play().catch(e => console.log('Could not play alert sound'));
							}
							
							console.log('🚨 Auto-generated ESP2 sensor alert:', alert);
						});
					}

					console.log("📊 ESP2 sensor data updated:", sensorData);
				}
			} catch (e) {
				setMqttError("Parse error: " + (e?.message || e));
				console.error("MQTT message parse error:", e);
			}
		});
		
		return () => {
			clearTimeout(connectionTimer);
			try {
				mqttClient.end(true);
			} catch {}
		};
	}, []);
	
	// Calculate IoT averages whenever iotReadings change
	useEffect(() => {
		if (iotReadings.esp1 && iotReadings.esp2) {
			setIotAverages({
				temperature: (
					(iotReadings.esp1.temperature + iotReadings.esp2.temperature) /
					2
				).toFixed(1),
				humidity: (
					(iotReadings.esp1.humidity + iotReadings.esp2.humidity) /
					2
				).toFixed(1),
				smoke: (
					(iotReadings.esp1.smoke + iotReadings.esp2.smoke) /
					2
				).toFixed(1),
				power: (
					(iotReadings.esp1.power + iotReadings.esp2.power) /
					2
				).toFixed(1),
			});
		} else if (iotReadings.esp1) {
			// If only ESP1 data is available, use it as the "average"
			setIotAverages({
				temperature: Number(iotReadings.esp1.temperature).toFixed(1),
				humidity: Number(iotReadings.esp1.humidity).toFixed(1),
				smoke: Number(iotReadings.esp1.smoke).toFixed(1),
				power: Number(iotReadings.esp1.power).toFixed(1),
			});
		}
	}, [iotReadings]);
	
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
			
			try {
				// Handle both data formats: {alert: ...} and direct alert object
				const alert = data.alert || data;
				
				if (!alert || typeof alert !== 'object') {
					console.error('❌ Invalid alert data received:', data);
					return;
				}
				
				setRealtimeAlerts(prev => {
					const updated = [alert, ...prev.slice(0, 9)]; // Keep last 10 alerts
					console.log('Updated realtime alerts:', updated.length);
					return updated;
				});
				setAlerts(prev => [alert, ...prev]); // Add to main alerts list
				
				// Play alert sound (optional)
				if (alertSound.current) {
					alertSound.current.play().catch(e => console.log('Could not play alert sound'));
				}
			} catch (error) {
				console.error('❌ Error processing new alert:', error);
			}
		});
		
		// Listen for alert updates
		socketService.onAlertUpdate((data) => {
			console.log('📝 Alert updated:', data);
			try {
				const alert = data.alert || data;
				if (!alert || !alert._id) {
					console.error('❌ Invalid alert update data:', data);
					return;
				}
				
				setAlerts(prev => prev.map(a => 
					a._id === alert._id ? alert : a
				));
				setRealtimeAlerts(prev => prev.map(a => 
					a._id === alert._id ? alert : a
				));
			} catch (error) {
				console.error('❌ Error processing alert update:', error);
			}
		});
		
		// Listen for alert resolutions
		socketService.onAlertResolved((data) => {
			console.log('✅ Alert resolved:', data);
			try {
				const alert = data.alert || data;
				if (!alert || !alert._id) {
					console.error('❌ Invalid alert resolution data:', data);
					return;
				}
				
				setAlerts(prev => prev.map(a => 
					a._id === alert._id ? alert : a
				));
				setRealtimeAlerts(prev => prev.map(a => 
					a._id === alert._id ? alert : a
				));
			} catch (error) {
				console.error('❌ Error processing alert resolution:', error);
			}
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

	// Data fetching configuration
	const dataEndpoints = useMemo(() => [
		{ url: '/api/support-ticket', setter: setIncidents, label: 'support tickets', key: 'incidents' },
		{ 
			url: '/api/datacenter', 
			setter: (data) => {
				setAssets(data);
				setServers(data.filter(item => item.assetType === 'server'));
			}, 
			label: 'datacenter assets', 
			key: 'assets' 
		},
		{ url: '/api/service', setter: setChanges, label: 'services', key: 'services' },
		{ url: '/api/datacenter/health/overview', setter: setHealthOverview, label: 'health overview', key: 'health' },
		{ url: '/api/users', setter: setUsers, label: 'users', key: 'users' },
		{ url: '/api/alerts', setter: setAlerts, label: 'alerts', key: 'alerts' }
	], []);

	// Fetch initial data
	useEffect(() => {
		const fetchWithErrorHandling = async ({ url, setter, label, key }) => {
			try {
				console.log(`🔍 Starting fetch for ${label} from ${url}`);
				setLoadingStates(prev => ({ ...prev, [key]: true }));
				setErrors(prev => ({ ...prev, [key]: null }));
				
				const response = await fetch(url);
				console.log(`📡 Response for ${label}:`, response.status, response.statusText);
				
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				
				const data = await response.json();
				console.log(`📊 Raw data for ${label}:`, data);
				console.log(`📊 Data type for ${label}:`, typeof data, Array.isArray(data) ? `Array(${data.length})` : 'Not array');
				
				// Validate data structure based on endpoint
				const validateDataStructure = (data, endpoint) => {
					if (!Array.isArray(data)) {
						console.warn(`⚠️ Expected array for ${endpoint}, got:`, typeof data);
						return false;
					}
					
					if (data.length > 0) {
						const sample = data[0];
						console.log(`🔍 Sample ${endpoint} object:`, sample);
						
						// Check required fields based on endpoint
						const requiredFields = {
							'/api/support-ticket': ['_id', 'issue', 'status'],
							'/api/users': ['_id', 'name', 'email'],
							'/api/datacenter': ['_id', 'assetType'],
							'/api/service': ['_id', 'name', 'type'],
							'/api/alerts': ['_id', 'type', 'severity']
						};
						
						const required = requiredFields[endpoint] || [];
						const missing = required.filter(field => !(field in sample));
						
						if (missing.length > 0) {
							console.warn(`⚠️ Missing required fields in ${endpoint}:`, missing);
							console.warn(`⚠️ Available fields:`, Object.keys(sample));
						} else {
							console.log(`✅ Data structure validation passed for ${endpoint}`);
						}
					}
					
					return true;
				};
				
				// Validate data before setting
				if (data === null || data === undefined) {
					console.warn(`⚠️ ${label} returned null/undefined, setting empty array`);
					setter([]);
				} else if (!validateDataStructure(data, url)) {
					console.warn(`⚠️ Data structure validation failed for ${label}, setting empty array`);
					setter([]);
				} else {
					setter(data);
				}
				
				console.log(`✅ Successfully loaded ${label}:`, Array.isArray(data) ? data.length : 'N/A');
			} catch (error) {
				console.error(`❌ Failed to load ${label} from ${url}:`, error);
				console.error(`❌ Error details:`, error.stack);
				setErrors(prev => ({ ...prev, [key]: error.message }));
				setter([]);
			} finally {
				setLoadingStates(prev => ({ ...prev, [key]: false }));
			}
		};

		const loadData = async () => {
			await Promise.all(dataEndpoints.map(fetchWithErrorHandling));
			setIsLoading(false);
		};
		
		loadData();
	}, [dataEndpoints]);
	// Search term state
	const [searchTerm, setSearchTerm] = useState('');
	// Filtered data based on search term with safety checks
	const filteredIncidents = useMemo(() => {
		if (!Array.isArray(incidents)) {
			console.warn('⚠️ incidents is not an array:', incidents);
			return [];
		}
		
		const term = searchTerm.toLowerCase();
		return incidents.filter(i => {
			if (!i || typeof i !== 'object') {
				console.warn('⚠️ Invalid incident object:', i);
				return false;
			}
			
			const id = i._id || i.id || '';
			const issue = i.issue || '';
			const agentName = i.supportAgentId?.name || '';
			
			return (
				id.toString().toLowerCase().includes(term) ||
				issue.toString().toLowerCase().includes(term) ||
				agentName.toString().toLowerCase().includes(term)
			);
		});
	}, [incidents, searchTerm]);
	const filteredAssets = useMemo(() => {
		if (!Array.isArray(assets)) {
			console.warn('⚠️ assets is not an array:', assets);
			return [];
		}
		
		const term = searchTerm.toLowerCase();
		return assets.filter(a => {
			if (!a || typeof a !== 'object') return false;
			return (
				(a.assetId?.name || '').toString().toLowerCase().includes(term) ||
				(a.assetType || '').toString().toLowerCase().includes(term) ||
				(a.location || '').toString().toLowerCase().includes(term)
			);
		});
	}, [assets, searchTerm]);
	
	const filteredServers = useMemo(() => {
		if (!Array.isArray(servers)) {
			console.warn('⚠️ servers is not an array:', servers);
			return [];
		}
		
		const term = searchTerm.toLowerCase();
		return servers.filter(s => {
			if (!s || typeof s !== 'object') return false;
			return (
				(s.assetId?.name || '').toString().toLowerCase().includes(term) ||
				(s.location || '').toString().toLowerCase().includes(term)
			);
		});
	}, [servers, searchTerm]);
	
	const filteredChanges = useMemo(() => {
		if (!Array.isArray(changes)) {
			console.warn('⚠️ changes is not an array:', changes);
			return [];
		}
		
		const term = searchTerm.toLowerCase();
		return changes.filter(c => {
			if (!c || typeof c !== 'object') return false;
			return (
				(c.name || '').toString().toLowerCase().includes(term) ||
				(c.type || '').toString().toLowerCase().includes(term)
			);
		});
	}, [changes, searchTerm]);
	
	const filteredUsers = useMemo(() => {
		if (!Array.isArray(users)) {
			console.warn('⚠️ users is not an array:', users);
			return [];
		}
		
		const term = searchTerm.toLowerCase();
		return users.filter(u => {
			if (!u || typeof u !== 'object') return false;
			return (
				(u.name || '').toString().toLowerCase().includes(term) ||
				(u.email || '').toString().toLowerCase().includes(term) ||
				(u.role || '').toString().toLowerCase().includes(term)
			);
		});
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
	// Export current table data as CSV with error handling
	const exportCSV = () => {
		try {
			let headers = [], rows = [];
			
			const dataMap = {
				'Incidents': {
					headers: ['Ticket ID','Issue','Priority','Status','Assignee','Updated'],
					data: filteredIncidents,
					mapper: (r) => [
						r._id || 'N/A',
						r.issue || 'N/A',
						r.priority || 'N/A',
						r.status || 'N/A',
						r.supportAgentId?.name || 'Unassigned',
						r.history?.length ? new Date(r.history[r.history.length-1].timestamp).toLocaleString() : new Date(r.createdAt).toLocaleString()
					]
				},
				'Assets': {
					headers: ['Asset ID','Type','Location'],
					data: filteredAssets,
					mapper: (a) => [
						a.assetId?.name || a.id || 'N/A',
						a.assetType || a.type || 'N/A',
						a.location || 'N/A'
					]
				},
				'Servers': {
					headers: ['Server Name','Location','Temperature','PowerDraw','Last Reading'],
					data: filteredServers,
					mapper: (s) => {
						const lr = s.latestReading || {};
						return [
							s.assetId?.name || s._id || 'N/A',
							s.location || 'N/A',
							lr.temperature ?? 'N/A',
							lr.powerDraw ?? 'N/A',
							lr.timestamp ? new Date(lr.timestamp).toLocaleString() : 'N/A'
						];
					}
				},
				'Changes': {
					headers: ['Service Name','Type','Created','Updated'],
					data: filteredChanges,
					mapper: (c) => [
						c.name || 'N/A',
						c.type || 'N/A',
						c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A',
						c.updatedAt ? new Date(c.updatedAt).toLocaleString() : 'N/A'
					]
				},
				'Users': {
					headers: ['Name','Email','Role','Created'],
					data: filteredUsers,
					mapper: (u) => [
						u.name || 'N/A',
						u.email || 'N/A',
						u.role || 'N/A',
						u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'
					]
				}
			};

			const config = dataMap[activeTab];
			if (!config) {
				throw new Error(`Export not supported for tab: ${activeTab}`);
			}

			headers = config.headers;
			rows = config.data.map(config.mapper);

			if (rows.length === 0) {
				throw new Error('No data available to export');
			}

			// Properly escape CSV values
			const escapeCsvValue = (value) => {
				const str = String(value);
				if (str.includes(',') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			};

			const csvContent = 'data:text/csv;charset=utf-8,' + [
				headers.map(escapeCsvValue).join(','),
				...rows.map(row => row.map(escapeCsvValue).join(','))
			].join('\n');
			
			const link = document.createElement('a');
			link.setAttribute('href', encodeURI(csvContent));
			link.setAttribute('download', `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			console.log(`✅ Successfully exported ${rows.length} rows for ${activeTab}`);
		} catch (error) {
			console.error('❌ Error exporting CSV:', error);
			setErrors(prev => ({ ...prev, export: `Failed to export CSV: ${error.message}` }));
		}
	};

	// Alert management actions (manual alert creation removed)
	const alertActions = {
		markAsRead: async (alertId) => {
			try {
				const response = await fetch(`/api/alerts/${alertId}/read`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
				});
				
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				
				console.log('✅ Alert marked as read');
				socketService.markAlertAsRead(alertId);
			} catch (error) {
				console.error('❌ Error marking alert as read:', error);
				setErrors(prev => ({ ...prev, alertActions: `Failed to mark alert as read: ${error.message}` }));
			}
		},

		resolve: async (alertId) => {
			try {
				const response = await fetch(`/api/alerts/${alertId}/resolve`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
				});
				
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				
				console.log('✅ Alert resolved');
			} catch (error) {
				console.error('❌ Error resolving alert:', error);
				setErrors(prev => ({ ...prev, alertActions: `Failed to resolve alert: ${error.message}` }));
			}
		}
	};
	// Add a safety check for critical data
	if (isLoading && (!incidents && !assets && !users)) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
					<p className="text-gray-500 mt-2">Fetching data from server</p>
				</div>
			</div>
		);
	}

	// Log current state for debugging
	console.log('🎯 Current component state:', {
		isLoading,
		incidents: incidents?.length || 'undefined',
		assets: assets?.length || 'undefined',
		users: users?.length || 'undefined',
		alerts: alerts?.length || 'undefined',
		errors: Object.keys(errors).filter(key => errors[key]).length
	});

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
						{ icon: Users, label: 'Users', id: 'Users' },
						{ icon: Wifi, label: 'IoT Sensors', id: 'IoT' }
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
							
							{/* Connection Status */}
							<div className="flex items-center space-x-4">
								<ConnectionIndicator 
									isConnected={isConnected} 
									label={isConnected ? "WS" : "WS Off"} 
									icon={isConnected ? Wifi : WifiOff} 
								/>
								<ConnectionIndicator 
									isConnected={mqttStatus.includes("Connected")} 
									label={mqttStatus.includes("Connected") ? "Sensors" : "No Sensors"} 
									icon={Thermometer} 
								/>
							</div>

							{/* Sensor Alert Status & Debug Toggle */}
							<div className="flex items-center space-x-4 text-sm">
								<div className="flex items-center">
									<div className={`w-2 h-2 rounded-full mr-2 ${(iotReadings.esp1 || iotReadings.esp2) ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
									<span className="text-gray-600">Auto Alerts</span>
								</div>
								<button
									onClick={() => setDebugMode(!debugMode)}
									className={`px-2 py-1 rounded text-xs font-mono ${
										debugMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
									} hover:bg-opacity-80 transition-colors`}
									title="Toggle debug information"
								>
									{debugMode ? '🐛 Debug ON' : '🔧 Debug'}
								</button>
							</div>
							
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
					{kpiMetrics.map(({ icon: Icon, title, value, isLive, status }, idx) => (
						<div className={`stat-card kpi kpi-${idx + 1} ${isLive ? 'live-sensor' : ''}`} key={title}>
							<div className="kpi-icon">
								<Icon className="w-5 h-5" />
								{isLive && (
									<span className={`ml-2 w-2 h-2 rounded-full ${
										status?.includes("Connected") ? 'bg-green-500 animate-pulse' : 'bg-red-500'
									}`}></span>
								)}
							</div>
							<div>
								<h3 className="text-gray-600">
									{title}
									{isLive && (
										<span className="ml-1 text-xs text-green-600 font-medium">LIVE</span>
									)}
								</h3>
								<p className={`text-3xl font-bold ${isLive && isSensorDataStale ? 'text-gray-400' : ''}`}>
									{isLive && isSensorDataStale ? '—' : value}
								</p>
								{isLive && lastSensorUpdate && (
									<p className="text-xs text-gray-500 mt-1">
										Last: {new Date(lastSensorUpdate).toLocaleTimeString()}
									</p>
								)}
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

				{/* Debug Panel */}
				{debugMode && (
					<div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h3 className="text-blue-800 font-semibold mb-3 flex items-center">
							🐛 Debug Information
							<button 
								onClick={() => setDebugMode(false)}
								className="ml-auto text-blue-600 hover:text-blue-800"
								title="Close debug panel"
							>
								<X className="w-4 h-4" />
							</button>
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div className="bg-white rounded p-3">
								<h4 className="font-semibold text-gray-800 mb-2">Data State</h4>
								<ul className="space-y-1 text-gray-600">
									<li>Incidents: {Array.isArray(incidents) ? incidents.length : 'Invalid'}</li>
									<li>Assets: {Array.isArray(assets) ? assets.length : 'Invalid'}</li>
									<li>Users: {Array.isArray(users) ? users.length : 'Invalid'}</li>
									<li>Alerts: {Array.isArray(alerts) ? alerts.length : 'Invalid'}</li>
									<li>Realtime Alerts: {realtimeAlerts.length}</li>
								</ul>
							</div>
							<div className="bg-white rounded p-3">
								<h4 className="font-semibold text-gray-800 mb-2">Loading State</h4>
								<ul className="space-y-1 text-gray-600">
									<li>Overall: {isLoading ? 'Loading...' : 'Ready'}</li>
									{Object.entries(loadingStates).map(([key, loading]) => (
										<li key={key}>
											{key}: {loading ? 'Loading...' : 'Done'}
										</li>
									))}
								</ul>
							</div>
							<div className="bg-white rounded p-3">
								<h4 className="font-semibold text-gray-800 mb-2">Connections</h4>
								<ul className="space-y-1 text-gray-600">
									<li>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</li>
									<li>MQTT: {mqttStatus}</li>
									<li>Sensors: {!isSensorDataStale ? '✅ Fresh' : '⚠️ Stale'}</li>
									<li>Last Update: {lastSensorUpdate ? new Date(lastSensorUpdate).toLocaleTimeString() : 'Never'}</li>
								</ul>
							</div>
						</div>
						{Object.keys(errors).length > 0 && (
							<div className="mt-3 bg-red-50 rounded p-3">
								<h4 className="font-semibold text-red-800 mb-2">Active Errors</h4>
								<ul className="space-y-1 text-red-600 text-sm">
									{Object.entries(errors).map(([key, error]) => 
										error && <li key={key}>• {key}: {error}</li>
									)}
								</ul>
							</div>
						)}
					</div>
				)}

				{/* Enhanced Error Display */}
				{(Object.keys(errors).some(key => errors[key]) || mqttError) && (
					<div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<h3 className="text-red-800 font-semibold mb-2">⚠️ Some data could not be loaded:</h3>
						<ul className="text-red-700 text-sm space-y-1">
							{Object.entries(errors).map(([key, error]) => 
								error && (
									<li key={key} className="flex items-start">
										<span className="mr-2">•</span>
										<div>
											<strong>{key}:</strong> {error}
											<div className="text-xs text-red-600 mt-1">
												Check browser console for detailed error logs
											</div>
										</div>
									</li>
								)
							)}
							{mqttError && (
								<li className="flex items-start">
									<span className="mr-2">•</span>
									<div>
										<strong>MQTT Sensors:</strong> {mqttError}
									</div>
								</li>
							)}
						</ul>
						<div className="mt-3 pt-3 border-t border-red-200">
							<button 
								onClick={() => window.location.reload()} 
								className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
							>
								🔄 Retry Loading
							</button>
						</div>
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
								{activeTab === 'IoT' && 'IoT Sensor Dashboard'}
							</h2>
							<button className="btn-quiet" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</button>
						</div>
						{activeTab === 'IoT' ? (
							<div className="space-y-6">
								{/* Professional MQTT Connection Status */}
								<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
									<div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
										<h3 className="text-lg font-semibold text-white flex items-center">
											<Cloud className="w-5 h-5 mr-3" />
											MQTT Broker Connection
										</h3>
										<p className="text-indigo-100 text-sm mt-1">Real-time sensor data stream</p>
									</div>
									
									<div className="p-6">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											{/* Connection Status */}
											<div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center">
														<div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
															mqttStatus.includes("Connected") ? 'bg-green-500' : 'bg-red-500'
														}`}>
															<Wifi className="w-5 h-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-gray-800">Connection</h4>
															<p className="text-sm text-gray-500">MQTT Broker</p>
														</div>
													</div>
													<div className={`w-3 h-3 rounded-full ${
														mqttStatus.includes("Connected") ? 'bg-green-400 animate-pulse' : 'bg-red-400'
													}`}></div>
												</div>
												<div className={`text-lg font-bold ${
													mqttStatus.includes("Connected") ? 'text-green-600' : 'text-red-600'
												}`}>
													{mqttStatus.includes("Connected") ? "Online" : "Offline"}
												</div>
												<div className="text-sm text-gray-600 mt-1">
													{mqttStatus}
												</div>
											</div>

											{/* Data Stream Status */}
											<div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg border border-slate-200 p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center">
														<div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
															!isSensorDataStale ? 'bg-purple-500' : 'bg-gray-500'
														}`}>
															<ActivityIcon className="w-5 h-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-gray-800">Data Stream</h4>
															<p className="text-sm text-gray-500">Sensor Readings</p>
														</div>
													</div>
													<div className={`w-3 h-3 rounded-full ${
														!isSensorDataStale ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'
													}`}></div>
												</div>
												<div className={`text-lg font-bold ${
													!isSensorDataStale ? 'text-purple-600' : 'text-gray-600'
												}`}>
													{!isSensorDataStale ? "Active" : "Stale"}
												</div>
												<div className="text-sm text-gray-600 mt-1">
													{lastSensorUpdate ? 
														`Last: ${new Date(lastSensorUpdate).toLocaleTimeString()}` : 
														'No data received'
													}
												</div>
											</div>

											{/* Broker Information */}
											<div className="bg-gradient-to-br from-slate-50 to-green-50 rounded-lg border border-slate-200 p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center">
														<div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
															<Server className="w-5 h-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-gray-800">Broker Info</h4>
															<p className="text-sm text-gray-500">HiveMQ Cloud</p>
														</div>
													</div>
													<div className="w-3 h-3 rounded-full bg-blue-400"></div>
												</div>
												<div className="text-lg font-bold text-green-600">
													EU-Central
												</div>
												<div className="text-sm text-gray-600 mt-1">
													Port: 8884 (WSS)
												</div>
											</div>
										</div>

										{/* Active Topics */}
										<div className="mt-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
											<h5 className="font-semibold text-gray-800 mb-3 flex items-center">
												<LayoutDashboard className="w-4 h-4 mr-2" />
												Active Subscriptions
											</h5>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
													<div className="flex items-center">
														<div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
														<span className="font-mono text-sm text-gray-700">ESP32/sensors</span>
													</div>
													<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ESP-01</span>
												</div>
												<div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
													<div className="flex items-center">
														<div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
														<span className="font-mono text-sm text-gray-700">ESP32/sensors2</span>
													</div>
													<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ESP-02</span>
												</div>
											</div>
										</div>

										{/* Error Display */}
										{mqttError && (
											<div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
												<div className="flex items-start">
													<AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
													<div>
														<h6 className="font-semibold text-red-800 mb-1">Connection Error</h6>
														<p className="text-red-700 text-sm">{mqttError}</p>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Live ESP32 Sensors */}
								{liveSensors.temperature !== null && !isSensorDataStale && (
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
											<ActivityIcon className="w-5 h-5 mr-2" />
											🔴 Live ESP32 Sensors
										</h3>
										<div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
											<div className="text-center">
												<Thermometer className="w-6 h-6 mx-auto mb-1 text-blue-500" />
												<div className="font-semibold">{Number(liveSensors.temperature).toFixed(1)}°C</div>
												<div className="text-gray-600">Temperature</div>
											</div>
											<div className="text-center">
												<Droplet className="w-6 h-6 mx-auto mb-1 text-blue-500" />
												<div className="font-semibold">{liveSensors.humidity !== null ? Number(liveSensors.humidity).toFixed(1) + '%' : 'N/A'}</div>
												<div className="text-gray-600">Humidity</div>
											</div>
											<div className="text-center">
												<Flame className="w-6 h-6 mx-auto mb-1 text-red-500" />
												<div className="font-semibold">{liveSensors.smoke1 !== null ? Number(liveSensors.smoke1).toFixed(1) : 'N/A'}</div>
												<div className="text-gray-600">Smoke 1</div>
											</div>
											<div className="text-center">
												<Flame className="w-6 h-6 mx-auto mb-1 text-red-500" />
												<div className="font-semibold">{liveSensors.smoke2 !== null ? Number(liveSensors.smoke2).toFixed(1) : 'N/A'}</div>
												<div className="text-gray-600">Smoke 2</div>
											</div>
											<div className="text-center">
												<Zap className="w-6 h-6 mx-auto mb-1 text-purple-500" />
												<div className="font-semibold">{liveSensors.proximity !== null ? Number(liveSensors.proximity).toFixed(1) : 'N/A'}</div>
												<div className="text-gray-600">Proximity</div>
											</div>
										</div>
										<div className="text-xs text-gray-500 mt-3">
											Last update: {new Date(lastSensorUpdate).toLocaleTimeString()}
										</div>
									</div>
								)}

								{/* Professional IoT Sensors Grid */}
								<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
									<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
										<h3 className="text-xl font-semibold text-white flex items-center">
											<Server className="w-6 h-6 mr-3" />
											IoT Environmental Monitoring
										</h3>
										<p className="text-blue-100 text-sm mt-1">Real-time sensor data from datacenter nodes</p>
									</div>
									
									<div className="p-6">
										{/* Dynamic grid layout based on whether averages are shown */}
										<div className={`grid gap-6 ${(iotReadings.esp1 || iotReadings.esp2) ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2 justify-items-center max-w-4xl mx-auto'}`}>
											{/* Average Metrics Card */}
											{(iotReadings.esp1 || iotReadings.esp2) && (
												<div className="bg-gradient-to-br from-slate-50 to-green-50 rounded-lg border border-slate-200 p-5">
													<div className="flex items-center justify-between mb-4">
														<div className="flex items-center">
															<div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
																<LayoutDashboard className="w-5 h-5 text-white" />
															</div>
															<div>
																<h4 className="font-semibold text-gray-800">Environment Avg</h4>
																<p className="text-sm text-gray-500">Calculated Metrics</p>
															</div>
														</div>
														<div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
													</div>
													
													<div className="grid grid-cols-2 gap-4">
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Thermometer className="w-4 h-4 text-red-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Temperature</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{iotAverages.temperature}°C</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Droplet className="w-4 h-4 text-blue-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Humidity</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{iotAverages.humidity}%</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Flame className="w-4 h-4 text-orange-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Smoke Level</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{iotAverages.smoke}</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Zap className="w-4 h-4 text-purple-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Power</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{iotAverages.power}V</div>
														</div>
													</div>
													
													{iotReadings.esp1 && !iotReadings.esp2 && (
														<div className="text-xs text-gray-500 mt-3 text-center">
															* Based on ESP-01 data only
														</div>
													)}
													{iotReadings.esp1 && iotReadings.esp2 && (
														<div className="text-xs text-green-600 mt-3 text-center font-medium">
															✓ Multi-node average active
														</div>
													)}
												</div>
											)}

											{/* ESP1 Sensor Node */}
											<div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-5 w-full max-w-md">
												<div className="flex items-center justify-between mb-4">
													<div className="flex items-center">
														<div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
															<Server className="w-5 h-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-gray-800">Node ESP-01</h4>
															<p className="text-sm text-gray-500">Primary Sensor</p>
														</div>
													</div>
													<div className={`w-3 h-3 rounded-full ${iotReadings.esp1 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
												</div>
												
												{iotReadings.esp1 ? (
													<div className="grid grid-cols-2 gap-4">
														<div className={`bg-white rounded-lg p-3 border ${
															iotReadings.esp1.temperature >= SENSOR_THRESHOLDS.temperature.critical ? 'border-red-300 bg-red-50' :
															iotReadings.esp1.temperature > SENSOR_THRESHOLDS.temperature.max ? 'border-yellow-300 bg-yellow-50' :
															'border-gray-100'
														}`}>
															<div className="flex items-center mb-2">
																<Thermometer className={`w-4 h-4 mr-2 ${
																	iotReadings.esp1.temperature >= SENSOR_THRESHOLDS.temperature.critical ? 'text-red-600' :
																	iotReadings.esp1.temperature > SENSOR_THRESHOLDS.temperature.max ? 'text-yellow-600' :
																	'text-red-500'
																}`} />
																<span className="text-sm font-medium text-gray-600">Temperature</span>
															</div>
															<div className={`text-2xl font-bold ${
																iotReadings.esp1.temperature >= SENSOR_THRESHOLDS.temperature.critical ? 'text-red-600' :
																iotReadings.esp1.temperature > SENSOR_THRESHOLDS.temperature.max ? 'text-yellow-600' :
																'text-gray-800'
															}`}>{Number(iotReadings.esp1.temperature).toFixed(1)}°C</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Droplet className="w-4 h-4 text-blue-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Humidity</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp1.humidity).toFixed(1)}%</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Flame className="w-4 h-4 text-orange-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Smoke Level</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp1.smoke).toFixed(1)}</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Zap className="w-4 h-4 text-purple-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Power</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp1.power).toFixed(1)}V</div>
														</div>
													</div>
												) : (
													<div className="text-center py-8 text-gray-500">
														<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
															<Server className="w-6 h-6 text-gray-400" />
														</div>
														<p className="font-medium">Waiting for sensor data...</p>
														<p className="text-sm mt-1">Node may be offline or initializing</p>
													</div>
												)}
											</div>

											{/* ESP2 Sensor Node */}
											<div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg border border-slate-200 p-5 w-full max-w-md">
												<div className="flex items-center justify-between mb-4">
													<div className="flex items-center">
														<div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
															<Server className="w-5 h-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-gray-800">Node ESP-02</h4>
															<p className="text-sm text-gray-500">Secondary Sensor</p>
														</div>
													</div>
													<div className={`w-3 h-3 rounded-full ${iotReadings.esp2 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
												</div>
												
												{iotReadings.esp2 ? (
													<div className="grid grid-cols-2 gap-4">
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Thermometer className="w-4 h-4 text-red-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Temperature</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp2.temperature).toFixed(1)}°C</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Droplet className="w-4 h-4 text-blue-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Humidity</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp2.humidity).toFixed(1)}%</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Flame className="w-4 h-4 text-orange-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Smoke Level</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp2.smoke).toFixed(1)}</div>
														</div>
														<div className="bg-white rounded-lg p-3 border border-gray-100">
															<div className="flex items-center mb-2">
																<Zap className="w-4 h-4 text-purple-500 mr-2" />
																<span className="text-sm font-medium text-gray-600">Power</span>
															</div>
															<div className="text-2xl font-bold text-gray-800">{Number(iotReadings.esp2.power).toFixed(1)}V</div>
														</div>
													</div>
												) : (
													<div className="text-center py-8 text-gray-500">
														<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
															<Server className="w-6 h-6 text-gray-400" />
														</div>
														<p className="font-medium">Waiting for sensor data...</p>
														<p className="text-sm mt-1">Node may be offline or initializing</p>
													</div>
												)}
											</div>
										</div>

										{/* Summary Statistics */}
										{(iotReadings.esp1 || iotReadings.esp2) && (
											<div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
												<h5 className="font-semibold text-gray-800 mb-3 flex items-center">
													<LayoutDashboard className="w-4 h-4 mr-2" />
													Environmental Summary
												</h5>
												<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
													<div>
														<div className="text-xl font-bold text-gray-800">{iotAverages.temperature}°C</div>
														<div className="text-sm text-gray-600">Avg Temperature</div>
													</div>
													<div>
														<div className="text-xl font-bold text-gray-800">{iotAverages.humidity}%</div>
														<div className="text-sm text-gray-600">Avg Humidity</div>
													</div>
													<div>
														<div className="text-xl font-bold text-gray-800">{iotAverages.smoke}</div>
														<div className="text-sm text-gray-600">Avg Smoke</div>
													</div>
													<div>
														<div className="text-xl font-bold text-gray-800">{iotAverages.power}V</div>
														<div className="text-sm text-gray-600">Avg Power</div>
													</div>
												</div>
												{iotReadings.esp1 && !iotReadings.esp2 && (
													<div className="text-xs text-gray-500 mt-2 text-center">
														* Averages based on ESP-01 data only
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						) : (
							<>
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
									{activeTab === 'Incidents' && (
										paginatedData.length > 0 ? (
											paginatedData.map((row) => {
												if (!row || !row._id) {
													console.warn('⚠️ Invalid incident row:', row);
													return null;
												}
												return (
													<tr key={row._id}>
														<td>{row._id || 'N/A'}</td>
														<td>{row.issue || 'No description'}</td>
														<td><StatusBadge status={row.priority || 'medium'} type="priority" /></td>
														<td><StatusBadge status={row.status || 'open'} /></td>
														<td>{row.supportAgentId?.name || 'Unassigned'}</td>
														<td>{
															row.history?.length ? 
																new Date(row.history[row.history.length - 1].timestamp).toLocaleString() : 
																new Date(row.createdAt || Date.now()).toLocaleString()
														}</td>
													</tr>
												);
											}).filter(Boolean)
										) : (
											<tr>
												<td colSpan="6" className="text-center py-8 text-gray-500">
													<div className="flex flex-col items-center">
														<AlertTriangle className="w-8 h-8 text-gray-400 mb-2" />
														<span>No incidents found</span>
														<span className="text-sm mt-1">Check your search filters or add new incidents</span>
													</div>
												</td>
											</tr>
										)
									)}
									{activeTab === 'Assets' && (
										paginatedData.length > 0 ? (
											paginatedData.map((a) => {
												if (!a || (!a.id && !a._id)) {
													console.warn('⚠️ Invalid asset row:', a);
													return null;
												}
												return (
													<tr key={a.id || a._id}>
														<td>{a.id || a._id || 'N/A'}</td>
														<td>{a.type || a.assetType || 'Unknown'}</td>
														<td>{a.owner || 'Unassigned'}</td>
														<td><StatusBadge status={a.status || 'unknown'} /></td>
														<td>{a.location || 'Not specified'}</td>
													</tr>
												);
											}).filter(Boolean)
										) : (
											<tr>
												<td colSpan="5" className="text-center py-8 text-gray-500">
													<div className="flex flex-col items-center">
														<Server className="w-8 h-8 text-gray-400 mb-2" />
														<span>No assets found</span>
														<span className="text-sm mt-1">Add assets to your inventory</span>
													</div>
												</td>
											</tr>
										)
									)}
									{activeTab === 'Servers' && (
										paginatedData.length > 0 ? (
											paginatedData.map((s) => {
												if (!s || !s._id) {
													console.warn('⚠️ Invalid server row:', s);
													return null;
												}
												const { assetId, location, latestReading } = s;
												return (
													<tr key={s._id}>
														<td>{assetId?.name || s._id || 'Unknown'}</td>
														<td>{location || 'Not specified'}</td>
														<td>{latestReading?.temperature ?? '-'}</td>
														<td>{latestReading?.powerDraw ?? '-'}</td>
														<td>{latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleString() : '-'}</td>
													</tr>
												);
											}).filter(Boolean)
										) : (
											<tr>
												<td colSpan="5" className="text-center py-8 text-gray-500">
													<div className="flex flex-col items-center">
														<Server className="w-8 h-8 text-gray-400 mb-2" />
														<span>No servers found</span>
														<span className="text-sm mt-1">Add servers to your fleet</span>
													</div>
												</td>
											</tr>
										)
									)}
									{activeTab === 'Changes' && (
										paginatedData.length > 0 ? (
											paginatedData.map((c) => {
												if (!c || !c._id) {
													console.warn('⚠️ Invalid change row:', c);
													return null;
												}
												return (
													<tr key={c._id}>
														<td>{c.name || 'Unnamed service'}</td>
														<td>{c.type || 'Unknown'}</td>
														<td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A'}</td>
														<td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : 'N/A'}</td>
													</tr>
												);
											}).filter(Boolean)
										) : (
											<tr>
												<td colSpan="4" className="text-center py-8 text-gray-500">
													<div className="flex flex-col items-center">
														<Wrench className="w-8 h-8 text-gray-400 mb-2" />
														<span>No change requests found</span>
														<span className="text-sm mt-1">Submit change requests for service modifications</span>
													</div>
												</td>
											</tr>
										)
									)}
									{activeTab === 'Users' && (
										paginatedData.length > 0 ? (
											paginatedData.map((u) => {
												if (!u || !u._id) {
													console.warn('⚠️ Invalid user row:', u);
													return null;
												}
												return (
													<tr key={u._id}>
														<td>{u.name || 'Unknown user'}</td>
														<td>{u.email || 'No email'}</td>
														<td>{u.role || 'No role assigned'}</td>
														<td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}</td>
													</tr>
												);
											}).filter(Boolean)
										) : (
											<tr>
												<td colSpan="4" className="text-center py-8 text-gray-500">
													<div className="flex flex-col items-center">
														<Users className="w-8 h-8 text-gray-400 mb-2" />
														<span>No users found</span>
														<span className="text-sm mt-1">Add users to the system</span>
													</div>
												</td>
											</tr>
										)
									)}
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
							</>
						)}
					</div>

					{/* Right column: Real-time Alerts, Health & Activity */}
					<div className="space-y-6">
						{/* Real-time Alerts */}
						<div className="stat-card">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-gray-800 flex items-center">
								<Bell className="w-4 h-4 mr-2" />
								Live Alerts
								{realtimeAlerts.length > 0 && (
									<span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
										{realtimeAlerts.length > 9 ? '9+' : realtimeAlerts.length}
									</span>
								)}
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
									{Array.isArray(realtimeAlerts) && realtimeAlerts.slice(0, 10).map((alert) => {
										if (!alert || !alert._id) {
											console.warn('Invalid alert object:', alert);
											return null;
										}
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
															onClick={() => alertActions.markAsRead(alert._id)}
															className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
															title="Mark as read"
														>
															<Eye className="w-4 h-4" />
														</button>
													)}
													<button 
														onClick={() => alertActions.resolve(alert._id)}
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
