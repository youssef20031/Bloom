import React, { useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt";

// ====== 🔧 Configure your HiveMQ Cloud connection here ======
const BROKER_URL =
  "wss://c2e0fd901fdb464e8b397971387b99f7.s1.eu.hivemq.cloud:8884/mqtt"; // WSS only
const USERNAME = "seiff"; // ⚠️ avoid hardcoding in production
const PASSWORD = "Seif1234"; // ⚠️ avoid hardcoding in production
const TOPIC = "ESP32/sensors"; // change to your actual topic

// Optional: how long until we mark data as stale (ms)
const STALE_AFTER_MS = 5000;

// Small helper to coerce numbers that might arrive as strings
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

export default function MqttLiveDashboard() {
  const clientRef = useRef(null);
  const [status, setStatus] = useState("Connecting…");
  const [lastPayloadRaw, setLastPayloadRaw] = useState("");
  const [lastTs, setLastTs] = useState(null);
  const [error, setError] = useState("");

  // Latest sensor values
  const [sensors, setSensors] = useState({
    temperature: null,
    humidity: null,
    proximity: null,
    smoke1: null,
    smoke2: null,
  });

  // Derived UI flags
  const isStale = useMemo(() => {
    if (!lastTs) return true;
    return Date.now() - lastTs > STALE_AFTER_MS;
  }, [lastTs]);

  useEffect(() => {
    // Create a persistent client with auto-reconnect
    const client = mqtt.connect(BROKER_URL, {
      username: USERNAME,
      password: PASSWORD,
      clientId: "react_" + Math.random().toString(16).slice(2, 10),
      keepalive: 60,
      reconnectPeriod: 2000, // 2s backoff
      clean: true,
    });

    clientRef.current = client;

    client.on("connect", () => {
      setStatus("Connected ✅");
      setError("");
      client.subscribe(TOPIC, (err) => {
        if (err) setError("Subscribe error: " + err.message);
      });
    });

    client.on("reconnect", () => setStatus("Reconnecting…"));
    client.on("offline", () => setStatus("Offline ❌"));
    client.on("close", () => setStatus("Closed"));
    client.on("error", (err) => setError(err?.message || String(err)));

    client.on("message", (_topic, payload) => {
      try {
        const raw = payload.toString("utf8");
        const clean = raw.replace(/\u00A0/g, " ").trim();
        setLastPayloadRaw(clean);

        const obj = JSON.parse(clean);

        setSensors({
          temperature: toNum(obj.temperature),
          humidity: toNum(obj.humidity),
          proximity: toNum(obj.proximity),
          smoke1: toNum(obj.smoke1),
          smoke2: toNum(obj.smoke2),
        });
        setLastTs(Date.now());
      } catch (e) {
        setError("Parse error: " + (e?.message || e));
      }
    });

    return () => {
      try {
        client.end(true); // force close
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">MQTT Live Sensors</h1>
          <span
            className={
              "text-sm px-3 py-1 rounded-2xl shadow " +
              (status.includes("Connected")
                ? "bg-green-100 text-green-800"
                : status.includes("Reconnecting")
                ? "bg-yellow-100 text-yellow-800"
                : status.includes("Offline") || status.includes("Closed")
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800")
            }
          >
            {status}
          </span>
        </header>

        <div className="mb-4 text-sm text-gray-600">
          <div>Broker: <code>{BROKER_URL}</code></div>
          <div>Topic: <code>{TOPIC}</code></div>
          <div>
            Last update: {lastTs ? new Date(lastTs).toLocaleTimeString() : "—"}
            {" "}
            {isStale && (
              <span className="ml-2 text-red-600">(stale)</span>
            )}
          </div>
          {error && (
            <div className="mt-2 text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MetricCard label="Temperature" value={fmt(sensors.temperature, 1)} unit="°C" />
          <MetricCard label="Humidity" value={fmt(sensors.humidity, 1)} unit="%" />
          <MetricCard label="Proximity" value={fmt(sensors.proximity)} />
          <MetricCard label="Smoke #1" value={fmt(sensors.smoke1)} />
          <MetricCard label="Smoke #2" value={fmt(sensors.smoke2)} />
        </div>

        {/* Raw payload (last message) */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-medium mb-2">Last payload</h2>
          <pre className="text-sm bg-gray-50 rounded p-3 overflow-x-auto">{lastPayloadRaw || "(waiting…)"}</pre>
          <p className="text-xs text-gray-500 mt-2">
            Expected format from device (example): {"{"}"temperature": 23.5, "humidity": 60.2, "proximity": 1, "smoke1": 300, "smoke2": 280{"}"}
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit }) {
  const display =
    value === null || value === undefined || Number.isNaN(value)
      ? "—"
      : String(value) + (unit ? ` ${unit}` : "");

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{display}</div>
    </div>
  );
}

function fmt(num, fixed) {
  if (num === null || num === undefined || Number.isNaN(num)) return null;
  return typeof fixed === "number" ? Number(num).toFixed(fixed) : Number(num);
}
