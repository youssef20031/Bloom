import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './adminview.css';

// --- Axios instance for API calls ---
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

function Badge({ variant = 'muted', children }) {
    return <span className={`badge ${variant}`}>{children || 'N/A'}</span>;
}

// --- Modal Component ---
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-btn">
                        ✕
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

function usePagination(items, pageSize) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [items.length, pageSize, page, totalPages]);

    const pageItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    return { page, setPage, totalPages, pageItems };
}

export default function Adminview() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);

    const [pageSize, setPageSize] = useState(3);
    const { page, setPage, totalPages, pageItems } = usePagination(
        customers,
        pageSize
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/customers');
                if (!mounted) return;
                setCustomers(res.data || []);
            } catch (e) {
                if (!mounted) return;
                setError(
                    e?.response?.data?.message || e?.message || 'Failed to load customers'
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const toName = (idOrObj) =>
        typeof idOrObj === 'string'
            ? idOrObj
            : idOrObj?.name || idOrObj?._id || '';

    return (
        <div className="dashboard">
            <div className="header">
                <div className="header-left">
                    <h1 className="logo">BLOOM</h1>
                    <h2>Welcome Back, Radwan</h2>
                </div>
            </div>

            <div className="main-content">
                <div className="entity-filters">
                    <div>
                        {['Customer', 'Employee', 'DC', 'Product', 'Service'].map(
                            (view) => (
                                <button
                                    key={view}
                                    className={view === 'Customer' ? 'active' : ''}
                                >
                                    {view}
                                </button>
                            )
                        )}
                    </div>
                    <button className="add-button">Add +</button>
                </div>

                <div className="table-container">
                    <div className="table-controls">
                        <div className="rows-selector">
                            <span>Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                {[3, 5, 10, 20].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                            <span>Row</span>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Hosting Status</th>
                                <th>Purchased Service</th>
                                <th>Status</th>
                                <th>Purchased Product</th>
                                <th>Status</th>
                                <th>Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="loading">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {error && !loading && (
                                <tr>
                                    <td colSpan={7} className="error">
                                        {error}
                                    </td>
                                </tr>
                            )}
                            {!loading && !error && pageItems.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="empty">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                !error &&
                                pageItems.map((c) => {
                                    const firstService = (c.purchasedServices || [])[0];
                                    const firstProduct = (c.purchasedProducts || [])[0];

                                    const hostingVariant =
                                        c.hostingStatus?.toLowerCase() === 'active'
                                            ? 'success'
                                            : 'muted';
                                    const serviceStatusVariant =
                                        firstService?.status?.toLowerCase() === 'active'
                                            ? 'success'
                                            : firstService?.status?.toLowerCase() === 'expired'
                                                ? 'danger'
                                                : 'muted';
                                    const productStatusVariant =
                                        firstProduct?.status?.toLowerCase() === 'active'
                                            ? 'success'
                                            : 'muted';

                                    return (
                                        <tr key={c._id} onClick={() => setSelected(c)}>
                                            <td>{c.companyName}</td>
                                            <td>
                                                <Badge variant={hostingVariant}>
                                                    {c.hostingStatus}
                                                </Badge>
                                            </td>
                                            <td className="service-name-cell">
                                                {firstService
                                                    ? toName(firstService.serviceId)
                                                    : 'N/A'}
                                            </td>
                                            <td>
                                                <Badge variant={serviceStatusVariant}>
                                                    {firstService?.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                {firstProduct
                                                    ? `${firstProduct.quantity || ''} ${toName(
                                                        firstProduct.productId
                                                    )}`.trim()
                                                    : 'N/A'}
                                            </td>
                                            <td>
                                                <Badge variant={productStatusVariant}>
                                                    {firstProduct?.status}
                                                </Badge>
                                            </td>
                                            <td>{c.price || 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {!loading && !error && customers.length > 0 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                            >
                                {'<'}
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(0, 5)
                                .map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={n === page ? 'active' : ''}
                                    >
                                        {n}
                                    </button>
                                ))}
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                            >
                                {'>'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="footer-nav">
                <button>Home</button>
                <button>Services</button>
                <button>Support</button>
                <button>More Info</button>
            </div>

            {/* --- Modal Rendering --- */}
            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected ? selected.companyName : ''}
            >
                {selected && (
                    <div className="modal-content">
                        {selected.contactPerson && (
                            <div className="info-row">
                                <b>Contact Person:</b> {selected.contactPerson}
                            </div>
                        )}
                        {selected.phone && (
                            <div className="info-row">
                                <b>Phone:</b> {selected.phone}
                            </div>
                        )}
                        {selected.address && (
                            <div className="info-row">
                                <b>Address:</b>{' '}
                                {[
                                    selected.address.street,
                                    selected.address.city,
                                    selected.address.country,
                                ]
                                    .filter(Boolean)
                                    .join(', ')}
                            </div>
                        )}

                        <h4>Services</h4>
                        {(selected.purchasedServices || []).length > 0 ? (
                            (selected.purchasedServices || []).map((s, idx) => (
                                <div key={idx} className="info-item">
                                    {toName(s.serviceId)} ({s.status})
                                </div>
                            ))
                        ) : (
                            <div className="info-item">No services purchased.</div>
                        )}

                        <h4>Products</h4>
                        {(selected.purchasedProducts || []).length > 0 ? (
                            (selected.purchasedProducts || []).map((p, idx) => (
                                <div key={idx} className="info-item">
                                    {toName(p.productId)} ({p.status}) x{p.quantity}
                                </div>
                            ))
                        ) : (
                            <div className="info-item">No products purchased.</div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}