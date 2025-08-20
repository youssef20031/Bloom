import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./adminview.css";

const api = axios.create({ baseURL: "http://localhost:3000/api" });

function Badge({ variant = "muted", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

function CellPill({ label, status, rightExtra }) {
  const variant = status?.toLowerCase() === "active" ? "success" : status?.toLowerCase() === "expired" ? "danger" : "muted";
  return (
    <div className="cell-pill">
      <span className="label" title={label}>{label}</span>
      <div className="extra">
        {rightExtra}
        {status && <Badge variant={variant}>{status}</Badge>}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function usePagination(items, pageSize) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [items.length, pageSize]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);
  return { page, setPage, totalPages, pageItems };
}

export default function CustomersDashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [currentView, setCurrentView] = useState("customers"); 
// can be: "customers" | "employees" | "datacenter" | "services" | "products"

  const [pageSize, setPageSize] = useState(5);
  const { page, setPage, totalPages, pageItems } = usePagination(customers, pageSize);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/customers");
        if (!mounted) return;
        setCustomers(res.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toName = (idOrObj) => (typeof idOrObj === "string" ? idOrObj : idOrObj?.name || idOrObj?._id || "");

return (
  <div className="dashboard">
    <div className="header">
      <div>
        <h1>Welcome Back, Radwan</h1>
        <p>{currentView.charAt(0).toUpperCase() + currentView.slice(1)} overview</p>
      </div>
    </div>

    {/* 🔹 Entity filter buttons */}
    <div className="entity-filters">
      {["customers", "employees", "datacenter", "services", "products"].map(view => (
        <button
          key={view}
          className={currentView === view ? "active" : ""}
          onClick={() => { setCurrentView(view); setPage(1); }}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>

    {/* 🔹 Conditional rendering for tables */}
    {currentView === "customers" && (
      <div className="table-container">
        <div className="table-controls">
          <div className="rows-selector">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[3, 5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>rows</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Hosting Status</th>
                <th>Purchased Services</th>
                <th>Purchased Products</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="loading">Loading...</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={4} className="error">{error}</td></tr>
              )}
              {!loading && !error && pageItems.length === 0 && (
                <tr><td colSpan={4} className="empty">No customers found.</td></tr>
              )}
              {!loading && !error && pageItems.map((c) => {
                const serviceList = c.purchasedServices || [];
                const productList = c.purchasedProducts || [];
                const hostingVariant = c.hostingStatus?.toLowerCase() === "active" ? "success" : "danger";

                return (
                  <tr key={c._id} onClick={() => setSelected(c)}>
                    <td>
                      <div className="company-info">
                        <span className="company-name">{c.companyName}</span>
                        <span className="contact">{c.contactPerson}</span>
                      </div>
                    </td>
                    <td><Badge variant={hostingVariant}>{c.hostingStatus}</Badge></td>
                    <td>
                      <div className="cell-list">
                        {serviceList.length === 0 && (<span className="empty">—</span>)}
                        {serviceList.map((s, idx) => (
                          <CellPill
                            key={idx}
                            label={toName(s.serviceId)}
                            status={s.status}
                            rightExtra={s.ipAddress ? <span className="extra-info">{s.ipAddress}</span> : null}
                          />
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="cell-list">
                        {productList.length === 0 && (<span className="empty">—</span>)}
                        {productList.map((p, idx) => (
                          <CellPill
                            key={idx}
                            label={toName(p.productId)}
                            status={p.status}
                            rightExtra={typeof p.quantity === "number" ? (<span className="extra-info">x{p.quantity}</span>) : null}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && !error && customers.length > 0 && (
          <div className="pagination">
            <div>
              Page <b>{page}</b> of <b>{totalPages}</b>
            </div>
            <div className="pagination-buttons">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map(n => (
                <button key={n} onClick={() => setPage(n)} className={n === page ? "active" : ""}>{n}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>
    )}

    {currentView === "employees" && (
      <div className="table-container">
        <h3>Employees Table (coming soon)</h3>
      </div>
    )}

    {currentView === "datacenter" && (
      <div className="table-container">
        <h3>Data Center Table (coming soon)</h3>
      </div>
    )}

    {currentView === "services" && (
      <div className="table-container">
        <h3>Services Table (coming soon)</h3>
      </div>
    )}

    {currentView === "products" && (
      <div className="table-container">
        <h3>Products Table (coming soon)</h3>
      </div>
    )}

    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.companyName : ""}>
      {selected && (
        <div className="modal-content">
          <div className="info-row"><b>Contact Person:</b> {selected.contactPerson}</div>
          {selected.phone && <div className="info-row"><b>Phone:</b> {selected.phone}</div>}
          {selected.address && (
            <div className="info-row"><b>Address:</b> {[selected.address.street, selected.address.city, selected.address.country].filter(Boolean).join(", ")}</div>
          )}
          <h4>Services</h4>
          {(selected.purchasedServices || []).map((s, idx) => (
            <div key={idx} className="info-item">{toName(s.serviceId)} ({s.status})</div>
          ))}
          <h4>Products</h4>
          {(selected.purchasedProducts || []).map((p, idx) => (
            <div key={idx} className="info-item">{toName(p.productId)} ({p.status}) x{p.quantity}</div>
          ))}
        </div>
      )}
    </Modal>
  </div>
);

}
