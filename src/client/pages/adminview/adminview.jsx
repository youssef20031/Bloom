import React, { useState, useEffect } from "react";
import axios from "axios";
import "./adminview.css";
import BloomLogo from "../../assets/Bloom_Logo.svg";
const api = axios.create({ baseURL: "/api" });
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
function getUserFromLocalStorage() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        // Optionally log the error or clear the corrupted data
        // localStorage.removeItem('user');
        return null;
    }
}
const user = getUserFromLocalStorage();
function Badge({ variant = "muted", children }) {
    return <span className={`status-badge ${variant}`}>{children}</span>;
}

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

export default function Dashboard() {
    const [currentView, setCurrentView] = useState("Customer");
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [pageSize, setPageSize] = useState(5);
    const [page, setPage] = useState(1);
    const [modalType, setModalType] = useState(null); // "details" | "employee" | "product" | "dc" | "service" | "Request" | null
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        email: "",
        password: "",
        role: "admin", // default role
    });
    const [employeeErrors, setEmployeeErrors] = useState({});
    // Product form state + errors (single modal pattern)
    const initialProduct = {
        name: "",
        description: "",
        type: "",
        vendor: "",
        specifications: {}, // kept as object; we'll edit via a JSON textarea string
        stock: "",
        price: "",
        serialNumber: "",
        model: "",
        location: { datacenter: "", rack: "", position: "" },
        status: "available",
        purchaseDate: "",
        warrantyExpiry: "",
        lastMaintenance: "",
        nextMaintenance: "",
        notes: "",
        tags: [],
    };
    const [newProduct, setNewProduct] = useState(initialProduct);
    const [productErrors, setProductErrors] = useState({});
    // text area helper for specifications JSON
    const [specText, setSpecText] = useState("");
    const [newDC, setNewDC] = useState({
        location: "",
        assetType: "",
        assetId: "",
        customerId: ""
    });
    const [dcErrors, setDcErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [newService, setNewService] = useState({
        name: "",
        description: "",
        type: "",
        associatedProducts: [],
        hostingDetails: { datacenterLocation: "", vmSpecs: {} },
        customerId: "",
        ipAddress: "",
    });
    const [editMode, setEditMode] = useState(false);
    const [serviceErrors, setServiceErrors] = useState({});
    const [openSection, setOpenSection] = useState(null);
    const [assignMode, setAssignMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };
    const validateService = () => {
        const errors = {};
        if (!newService.name?.trim()) errors.name = "Name is required.";
        if (!newService.type) errors.type = "Type is required.";

        // If customer is chosen, IP address becomes required
        if (newService.customerId && !newService.ipAddress?.trim()) {
            errors.ipAddress = "IP Address is required when assigning to a customer.";
        }

        // Validate associatedProducts
        if (newService.associatedProducts?.length > 0) {
            newService.associatedProducts.forEach((p, idx) => {
                if (!p.productId) {
                    errors[`product-${idx}`] = "Product selection is required.";
                }
                if (!p.quantity || parseInt(p.quantity, 10) <= 0) {
                    errors[`quantity-${idx}`] = "Quantity must be at least 1.";
                }
            });
        }

        return errors;
    };

    const toName = (idOrObj) =>
        typeof idOrObj === "string" ? idOrObj : idOrObj?.name || idOrObj?._id || "";

    // fetch customers only if Customer view is selected
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (currentView === "Customer") {
                    const res = await api.get("/customers");
                    if (mounted) setEntities(res.data || []);
                }

                if (currentView === "Employee") {
                    const roles = ["admin", "presales", "support", "it"];
                    let employees = [];
                    for (const role of roles) {
                        const res = await api.get(`/users/role/${role}`);
                        employees = employees.concat(res.data || []);
                    }
                    if (mounted) setEntities(employees);
                }
                if (currentView === "DC") {
                    const res = await api.get("/datacenter");
                    if (mounted) setEntities(res.data || []);
                    const prodRes = await api.get("/products");
                    const custRes = await api.get("/customers");
                    if (mounted) {
                        setProducts(prodRes.data || []);
                        setCustomers(custRes.data || []);
                    }
                }
                if (currentView === "Product") {
                    const res = await api.get("/products");
                    if (mounted) setEntities(res.data || []);
                }
                if (currentView === "Service") {
                    const res = await api.get("/service");
                    const prodRes = await api.get("/products");
                    const custRes = await api.get("/customers");
                    if (mounted) {
                        setEntities(res.data || []);
                        setProducts(prodRes.data || []);
                        setCustomers(custRes.data || []);
                    }
                }
                if (currentView === "Request") {
                    const res = await api.get("/request-change");
                    if (mounted) {
                        setEntities(res.data || []);
                    }
                }
                // Later: add Product, Service, DC fetches here
            } catch (e) {
                setError(e?.response?.data?.message || e?.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [currentView]);
    const handleSaveEmployee = async () => {
        let errors = {};

        if (!newEmployee.name.trim()) {
            errors.name = "Name is required";
        }
        if (!newEmployee.email.trim()) {
            errors.email = "Email is required";
        }
        if (!newEmployee.password.trim()) {
            errors.password = "Password is required";
        }
        if (!newEmployee.role) {
            errors.role = "Role is required";
        }

        setEmployeeErrors(errors);

        // Stop if there are errors
        if (Object.keys(errors).length > 0) return;

        try {
            await api.post("/users", newEmployee);
            // Refresh employees
            const roles = ["admin", "presales", "support", "it"];
            let employees = [];
            for (const role of roles) {
                const res = await api.get(`/users/role/${role}`);
                employees = employees.concat(res.data || []);
            }
            setEntities(employees);

            // Reset form + close modal
            setNewEmployee({ name: "", email: "", password: "", role: "admin" });
            setEmployeeErrors({});
            setModalType(null);
            toast.success("✅ Employee Added successfully!");
        } catch (e) {
            setEmployeeErrors({ general: e?.response?.data?.message || e.message });
        }
    };
    const handleSaveProduct = async () => {
        // inline validation
        const errs = {};
        if (!newProduct.name.trim()) errs.name = "Name is required.";
        if (!newProduct.type) errs.type = "Type is required.";
        if (newProduct.stock === "" || Number.isNaN(Number(newProduct.stock))) errs.stock = "Stock is required.";
        if (newProduct.price === "" || Number.isNaN(Number(newProduct.price))) errs.price = "Price is required.";

        // specifications JSON
        let parsedSpecs = {};
        if (specText.trim() !== "") {
            try {
                parsedSpecs = JSON.parse(specText);
            } catch {
                errs.specifications = "Invalid JSON format";
            }
        }

        setProductErrors(errs);
        if (Object.keys(errs).length) return;

        const payload = {
            ...newProduct,
            stock: Number(newProduct.stock),
            price: Number(newProduct.price),
            specifications: parsedSpecs,
            // convert empty strings to undefined for optional fields if you want cleaner payloads:
            serialNumber: newProduct.serialNumber || undefined,
            model: newProduct.model || undefined,
            location: {
                datacenter: newProduct.location.datacenter || undefined,
                rack: newProduct.location.rack || undefined,
                position: newProduct.location.position || undefined,
            },
            notes: newProduct.notes || undefined,
            tags: (newProduct.tags || []).filter(Boolean),
        };

        try {
            const res = await api.post("/products", payload);
            // optimistically update list if you're on Product view
            if (currentView === "Product") {
                setEntities((prev) => [res.data, ...prev]);
            }
            // reset + close modal
            setNewProduct(initialProduct);
            setSpecText("{}");
            setProductErrors({});
            setModalType(null);
            toast.success("✅ Product Added successfully!");
        } catch (err) {
            setProductErrors((p) => ({
                ...p,
                general: err?.response?.data?.message || err.message || "Failed to add product",
            }));
        }
    };
    const handleSaveDC = async () => {
        let errors = {};
        if (!newDC.location) errors.location = "Location is required";
        if (!newDC.assetType) errors.assetType = "Asset type is required";

        setDcErrors(errors);
        if (Object.keys(errors).length > 0) return;
        const payload = {
            location: newDC.location,
            assetType: newDC.assetType,
            assetId: newDC.assetId || undefined,
            customerId: newDC.customerId || undefined,
        };

        Object.keys(payload).forEach((key) => {
            if (payload[key] === "" || payload[key] === undefined) {
                delete payload[key];
            }
        });


        try {
            const res = await api.post("/datacenter", payload);
            const getres = await api.get("/datacenter");
            setEntities(getres.data || []);
            setModalType(null);
            setNewDC({ location: "", assetType: "", assetId: "", customerId: "" });
            setDcErrors({});
            toast.success("✅ DC added successfully!");
        } catch (e) {
            setDcErrors({ general: e?.response?.data?.message || "Failed to save datacenter" });
        }
    };
    const handleSaveService = async () => {
        // Build base payload
        const errors = validateService();
        if (Object.keys(errors).length > 0) {
            setServiceErrors(errors);
            return;
        }
        setServiceErrors({}); // clear old errors
        let payload = {
            name: newService.name,
            description: newService.description,
            type: newService.type,
            hostingDetails: {
                datacenterLocation: newService.datacenterLocation,
                vmSpecs: newService.vmSpecs
            }
        };

        // Expand associated products based on quantity
        if (newService.associatedProducts && newService.associatedProducts.length > 0) {
            let expanded = [];
            newService.associatedProducts.forEach((p) => {
                const qty = parseInt(p.quantity, 10) || 1;
                for (let i = 0; i < qty; i++) {
                    expanded.push(p.productId);
                }
            });
            payload.associatedProducts = expanded;
        }

        // Clean empty fields
        Object.keys(payload).forEach((key) => {
            if (payload[key] === "" || payload[key] === undefined) {
                delete payload[key];
            }
        });

        try {
            const res = await api.post("/service", payload);

            // If service is linked to a customer
            if (newService.customerId) {
                await api.post("/customers/add-service", {
                    customerId: newService.customerId,
                    serviceId: res.data._id,
                    ipAddress: newService.ipAddress || ""
                });

                // Add purchased products for the customer one by one
                for (const p of newService.associatedProducts) {
                    const qty = parseInt(p.quantity, 10) || 1;
                    await api.post("/customers/add-product", {
                        customerId: newService.customerId,
                        productId: p.productId,
                        quantity: qty
                    });
                }
            }

            // refresh table
            const refreshed = await api.get("/service");
            setEntities(refreshed.data || []);
            setModalType(null);
            setNewService({});
            toast.success("✅ Service Added successfully!");
        } catch (err) {
            console.error("Error saving service", err);
        }
    };


    // paginate
    const totalPages = Math.max(1, Math.ceil(entities.length / pageSize));
    const pageItems = entities.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <img src={BloomLogo} alt="Bloom Logo" className="logo-img" />
                        <nav className="main-nav">
                            <a href="#" className="nav-link">Home</a>
                            <a href="#" className="nav-link">Services</a>
                            <a href="#" className="nav-link">Support</a>
                            <a href="#" className="nav-link">More Info ▼</a>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="main-content">
                {/* Welcome Section */}
                <div className="welcome-section">
                    <h2 className="welcome-title">Welcome Back, {user?.name || 'Admin'}</h2>
                </div>

                {/* Entity Filters */}
                <div className="entity-filters">
                    <div className="tab-buttons">
                        {["Customer", "Employee", "DC", "Product", "Service", "Request"].map((view) => (
                            <button
                                key={view}
                                className={`tab-button ${currentView === view ? "active" : ""}`}
                                onClick={() => {
                                    setCurrentView(view);
                                    setSelected(null);
                                }}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                    <button className="add-button" onClick={() => {
                        setSelected(null);
                        if (currentView === "Employee") {
                            setNewEmployee({ name: "", email: "", password: "", role: "" });
                        }
                        setModalType(currentView.toLowerCase()); // "employee", "product", "dc", "service"

                    }}
                        disabled={currentView === "Customer" || currentView === "Request"}
                    >Add +</button>
                </div>

                {/* Conditional Rendering by currentView */}
                {currentView === "Customer" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
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
                                                c.hostingStatus?.toLowerCase() === "active"
                                                    ? "success"
                                                    : "danger";
                                            const serviceStatusVariant =
                                                firstService?.status?.toLowerCase() === "active"
                                                    ? "success"
                                                    : firstService?.status?.toLowerCase() === "expired"
                                                        ? "danger"
                                                        : "muted";
                                            const productStatusVariant =
                                                firstProduct?.status?.toLowerCase() === "active"
                                                    ? "success"
                                                    : "muted";

                                            return (
                                                <tr key={c._id || c.id} onClick={() => {
                                                    setSelected(c);
                                                    setModalType("details");
                                                }} className="table-row">
                                                    <td className="customer-name">{c.companyName}</td>
                                                    <td>
                                                        <Badge variant={hostingVariant}>
                                                            {c.hostingStatus}
                                                        </Badge>
                                                    </td>
                                                    <td className="service-name">
                                                        {firstService ? toName(firstService.serviceId) : "N/A"}
                                                    </td>
                                                    <td>
                                                        {firstService && (
                                                            <Badge variant={serviceStatusVariant}>
                                                                {firstService.status}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {firstProduct
                                                            ? `${firstProduct.quantity || ""} ${toName(
                                                                firstProduct.productId
                                                            )}`.trim()
                                                            : "N/A"}
                                                    </td>
                                                    <td>
                                                        {firstProduct && (
                                                            <Badge variant={productStatusVariant}>
                                                                {firstProduct.status}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="price">{c.price || "N/A"}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentView === "Employee" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={4} className="loading">Loading...</td>
                                        </tr>
                                    )}
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={4} className="error">{error}</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="empty">No employees found.</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.map((emp) => (
                                        <tr key={emp._id} onClick={() => {
                                            setSelected(emp);
                                            setModalType("details");
                                        }} className="table-row">
                                            <td>{emp.name}</td>
                                            <td>{emp.email}</td>
                                            <td>
                                                {emp.role}
                                            </td>
                                            <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination same as Customers */}
                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {currentView === "DC" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>Asset Type</th>
                                        <th>Asset</th>
                                        <th>Customer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={4} className="loading">Loading...</td>
                                        </tr>
                                    )}
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={4} className="error">{error}</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="empty">No datacenter assets found.</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.map((dc) => (
                                        <tr key={dc._id} onClick={() => {
                                            setSelected(dc);
                                            setModalType("details");
                                        }} className="table-row">
                                            <td>{dc.location}</td>
                                            <td>{dc.assetType}</td>
                                            <td>{dc.assetId?.name || dc.assetId?._id || "N/A"}</td>
                                            <td>{dc.customerId?.companyName || dc.customerId?._id || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination same as Employees */}
                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {currentView === "Product" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Stock</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={5} className="loading">Loading...</td>
                                        </tr>
                                    )}
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={5} className="error">{error}</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="empty">No products found.</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.map((prod) => (
                                        <tr
                                            key={prod._id}
                                            onClick={() => {
                                                setSelected(prod);
                                                setModalType("details");
                                            }}
                                            className="table-row"
                                        >
                                            <td>{prod.name}</td>
                                            <td>{prod.description || "—"}</td>
                                            <td>{prod.type}</td>
                                            <td>{typeof prod.stock === "number" ? prod.stock : "N/A"}</td>
                                            <td>{prod.price ? `$${prod.price}` : "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination same as other tables */}
                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {currentView === "Service" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Datacenter Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={4} className="loading">Loading...</td>
                                        </tr>
                                    )}
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={4} className="error">{error}</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="empty">No services found.</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.map((srv) => (
                                        <tr
                                            key={srv._id}
                                            onClick={() => {
                                                setSelected(srv);
                                                setModalType("details");
                                            }}
                                            className="table-row"
                                        >
                                            <td>{srv.name}</td>
                                            <td>{srv.description || "N/A"}</td>
                                            <td>{srv.type}</td>
                                            <td>{srv.hostingDetails?.datacenterLocation || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination same as others */}
                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {currentView === "Request" && (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Ticket Issue</th>
                                        <th>Tag</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={6} className="loading">Loading...</td>
                                        </tr>
                                    )}
                                    {error && !loading && (
                                        <tr>
                                            <td colSpan={6} className="error">{error}</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty">No requests found.</td>
                                        </tr>
                                    )}
                                    {!loading && !error && pageItems.map((req) => (
                                        <tr
                                            key={req._id}
                                            onClick={() => {
                                                setSelected(req);
                                                setModalType("details");
                                            }}
                                            className="table-row"
                                        >
                                            <td>{req.supportTicketId?.issue || "N/A"}</td>
                                            <td>{req.tag}</td>
                                            <td>{req.description || "N/A"}</td>
                                            <td>{req.status}</td>
                                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination same as Service */}
                        {!loading && !error && entities.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    <span>Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="page-size-select"
                                    >
                                        {[3, 5, 10, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <span>Row</span>
                                </div>
                                <div className="pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="page-btn"
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(0, 5)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`page-btn ${n === page ? "active" : ""}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    {totalPages > 5 && (
                                        <>
                                            <span className="page-dots">...</span>
                                            <button
                                                onClick={() => setPage(totalPages)}
                                                className="page-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="page-btn"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Modal Rendering */}
            <Modal
                open={!!modalType}
                onClose={() => {
                    setSelected(null);
                    setModalType(null);
                    setEmployeeErrors({});
                    setNewProduct(initialProduct);
                    setSpecText("");
                    setProductErrors({});
                    setNewDC({ location: "", assetType: "", assetId: "", customerId: "" });
                    setDcErrors({});
                    setEditMode(false);
                    setAssignMode(false);
                }}
                title={
                    modalType === "details"
                        ? selected?.companyName || selected?.name || "Details"
                        : modalType === "employee"
                            ? "Add Employee"
                            : modalType === "product"
                                ? "Add Product"
                                : modalType === "dc"
                                    ? "Add Datacenter"
                                    : modalType === "service"
                                        ? "Add Service"
                                        : ""
                }
            >
                {/* DETAILS MODAL */}
                {modalType === "details" && currentView === "Customer" && selected && (
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
                                <b>Address:</b>{" "}
                                {[selected.address.street, selected.address.city, selected.address.country]
                                    .filter(Boolean)
                                    .join(", ")}
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
                {modalType === "details" && currentView === "Employee" && selected && (
                    <div className="modal-content">
                        {!editMode ? (
                            // DETAILS VIEW
                            <>
                                <div className="info-row"><b>Name:</b> {selected.name}</div>
                                <div className="info-row"><b>Email:</b> {selected.email}</div>
                                <div className="info-row"><b>Role:</b> {selected.role}</div>
                                <div className="info-row"><b>Created At:</b> {new Date(selected.createdAt).toLocaleDateString()}</div>

                                <div className="modal-actions">
                                    <button onClick={() => setEditMode(true)}>Edit</button>
                                    <button
                                        className="danger-btn"
                                        onClick={async () => {
                                            if (selected._id === user?._id) {
                                                alert("⚠️ You cannot deactivate yourself!");
                                                return;
                                            }
                                            if (!window.confirm("Are you sure you want to deactivate this employee?")) return;

                                            try {
                                                await api.delete(`/users/${selected._id}`);
                                                setEntities((prev) => prev.filter((e) => e._id !== selected._id));
                                                setSelected(null);
                                                setModalType(null);
                                                toast.success("✅ Employee Deleted successfully!");
                                            } catch (err) {
                                                alert("Failed to deactivate employee: " + (err.response?.data?.error || err.message));
                                            }
                                        }}
                                    >
                                        Deactivate
                                    </button>
                                </div>
                            </>
                        ) : (
                            // EDIT VIEW
                            <>
                                <h3>Edit Employee</h3>
                                <div className="form-field">
                                    <label>Name:</label>
                                    <input
                                        type="text"
                                        value={selected.name}
                                        onChange={(e) =>
                                            setSelected((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        value={selected.email}
                                        onChange={(e) =>
                                            setSelected((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                    />
                                </div>
                                {selected._id !== user?._id && (
                                    <div className="form-field">
                                        <label>Role:</label>
                                        <select
                                            value={selected.role}
                                            onChange={(e) =>
                                                setSelected((prev) => ({ ...prev, role: e.target.value }))
                                            }
                                        >
                                            <option value="" disabled>
                                                Choose a role
                                            </option>
                                            <option value="admin">Admin</option>
                                            <option value="presales">Presales</option>
                                            <option value="support">Support</option>
                                            <option value="it">IT</option>
                                        </select>
                                    </div>
                                )}


                                <div className="modal-actions">
                                    <button
                                        onClick={async () => {
                                            try {
                                                console.log(selected);
                                                const { data } = await api.put(`/users/${selected._id}`, { "name": selected.name, "email": selected.email, "role": selected.role });
                                                setEntities((prev) =>
                                                    prev.map((e) => (e._id === data._id ? data : e))
                                                );
                                                setEditMode(false); // back to details view
                                                setModalType(null);
                                                toast.success("✅ Employee updated successfully!");
                                            } catch (err) {
                                                alert("Failed to update employee: " + (err.response?.data?.error || err.message));
                                            }
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button onClick={() => setEditMode(false)}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {modalType === "details" && currentView === "Product" && selected && (
                    <div className="modal-content">
                        {!editMode ? (
                            // ================= DETAILS VIEW =================
                            <>
                                <div className="info-row"><b>Name:</b> {selected.name}</div>
                                <div className="info-row"><b>Description:</b> {selected.description || "—"}</div>
                                <div className="info-row"><b>Type:</b> {selected.type}</div>
                                <div className="info-row"><b>Vendor:</b> {selected.vendor || "—"}</div>
                                <div className="info-row"><b>Stock:</b> {selected.stock ?? "—"}</div>
                                <div className="info-row"><b>Price:</b> ${selected.price ?? "—"}</div>

                                <h4>Hardware Tracking</h4>
                                <div className="info-row"><b>Serial Number:</b> {selected.serialNumber || "—"}</div>
                                <div className="info-row"><b>Model:</b> {selected.model || "—"}</div>
                                <div className="info-row"><b>Status:</b> {selected.status}</div>

                                <h4>Location</h4>
                                <div className="info-row"><b>Datacenter:</b> {selected.location?.datacenter || "—"}</div>
                                <div className="info-row"><b>Rack:</b> {selected.location?.rack || "—"}</div>
                                <div className="info-row"><b>Position:</b> {selected.location?.position || "—"}</div>

                                <h4>Maintenance</h4>
                                <div className="info-row"><b>Purchase Date:</b> {selected.purchaseDate ? new Date(selected.purchaseDate).toLocaleDateString() : "—"}</div>
                                <div className="info-row"><b>Warranty Expiry:</b> {selected.warrantyExpiry ? new Date(selected.warrantyExpiry).toLocaleDateString() : "—"}</div>
                                <div className="info-row"><b>Last Maintenance:</b> {selected.lastMaintenance ? new Date(selected.lastMaintenance).toLocaleDateString() : "—"}</div>
                                <div className="info-row"><b>Next Maintenance:</b> {selected.nextMaintenance ? new Date(selected.nextMaintenance).toLocaleDateString() : "—"}</div>

                                <div className="modal-actions">
                                    <button onClick={() => setEditMode(true)}>Edit</button>
                                </div>
                            </>
                        ) : (
                            // ================= EDIT VIEW =================
                            <>
                                <h3>Edit Product</h3>

                                {/* Collapsible Section: General Info */}
                                <div className="collapsible">
                                    <h4 onClick={() => toggleSection("general")}>General Info</h4>
                                    {openSection === "general" && (
                                        <>
                                            <div className="form-field">
                                                <label>Name:</label>
                                                <input
                                                    type="text"
                                                    value={selected.name || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Description:</label>
                                                <textarea
                                                    value={selected.description || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Type:</label>
                                                <select
                                                    value={selected.type || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, type: e.target.value }))}
                                                >
                                                    <option value="ai_model">AI Model</option>
                                                    <option value="server">Server</option>
                                                    <option value="storage">Storage</option>
                                                    <option value="network">Network</option>
                                                    <option value="gpu">GPU</option>
                                                    <option value="cpu">CPU</option>
                                                    <option value="memory">Memory</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="form-field">
                                                <label>Vendor:</label>
                                                <input
                                                    type="text"
                                                    value={selected.vendor || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, vendor: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Stock:</label>
                                                <input
                                                    type="number"
                                                    value={selected.stock ?? ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Price:</label>
                                                <input
                                                    type="number"
                                                    value={selected.price ?? ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Collapsible Section: Hardware */}
                                <div className="collapsible">
                                    <h4 onClick={() => toggleSection("hardware")}>Hardware</h4>
                                    {openSection === "hardware" && (
                                        <>
                                            <div className="form-field">
                                                <label>Serial Number:</label>
                                                <input
                                                    type="text"
                                                    value={selected.serialNumber || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, serialNumber: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Model:</label>
                                                <input
                                                    type="text"
                                                    value={selected.model || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, model: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Status:</label>
                                                <select
                                                    value={selected.status || "available"}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, status: e.target.value }))}
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="allocated">Allocated</option>
                                                    <option value="maintenance">Maintenance</option>
                                                    <option value="retired">Retired</option>
                                                    <option value="faulty">Faulty</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Collapsible Section: Location */}
                                <div className="collapsible">
                                    <h4 onClick={() => toggleSection("location")}>Location</h4>
                                    {openSection === "location" && (
                                        <>
                                            <div className="form-field">
                                                <label>Datacenter:</label>
                                                <input
                                                    type="text"
                                                    value={selected.location?.datacenter || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, location: { ...prev.location, datacenter: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Rack:</label>
                                                <input
                                                    type="text"
                                                    value={selected.location?.rack || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, location: { ...prev.location, rack: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Position:</label>
                                                <input
                                                    type="text"
                                                    value={selected.location?.position || ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, location: { ...prev.location, position: e.target.value } }))}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Collapsible Section: Maintenance */}
                                <div className="collapsible">
                                    <h4 onClick={() => toggleSection("maintenance")}>Maintenance</h4>
                                    {openSection === "maintenance" && (
                                        <>
                                            <div className="form-field">
                                                <label>Purchase Date:</label>
                                                <input
                                                    type="date"
                                                    value={selected.purchaseDate ? new Date(selected.purchaseDate).toISOString().split("T")[0] : ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, purchaseDate: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Warranty Expiry:</label>
                                                <input
                                                    type="date"
                                                    value={selected.warrantyExpiry ? new Date(selected.warrantyExpiry).toISOString().split("T")[0] : ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Last Maintenance:</label>
                                                <input
                                                    type="date"
                                                    value={selected.lastMaintenance ? new Date(selected.lastMaintenance).toISOString().split("T")[0] : ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label>Next Maintenance:</label>
                                                <input
                                                    type="date"
                                                    value={selected.nextMaintenance ? new Date(selected.nextMaintenance).toISOString().split("T")[0] : ""}
                                                    onChange={(e) => setSelected(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="modal-actions">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { data } = await api.put(`/products/${selected._id}`, selected);
                                                setEntities(prev => prev.map(p => (p._id === data._id ? data : p)));
                                                setEditMode(false);
                                                setModalType(null);
                                                toast.success("✅ Product updated successfully!");
                                            } catch (err) {
                                                alert("Failed to update product: " + (err.response?.data?.message || err.message));
                                            }
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button onClick={() => setEditMode(false)}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {modalType === "details" && currentView === "DC" && selected && (
                    <div className="modal-content">
                        <div className="info-row"><b>Location:</b> {selected.location}</div>
                        <div className="info-row"><b>Asset Type:</b> {selected.assetType}</div>
                        <div className="info-row"><b>Asset:</b> {selected.assetId?.name || "—"}</div>
                        <div className="info-row"><b>Customer:</b> {selected.customerId?.companyName || "—"}</div>
                        <h4>Latest IoT Reading</h4>
                        {(selected.iotReadings || []).length > 0 ? (
                            (() => {
                                const latest = [...selected.iotReadings].sort(
                                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                                )[0]; // get the latest one
                                return (
                                    <div className="info-item">
                                        <div><b>Timestamp:</b> {new Date(latest.timestamp).toLocaleString()}</div>
                                        {"temperature" in latest && <div><b>Temperature:</b> {latest.temperature}°C</div>}
                                        {"powerDraw" in latest && <div><b>Power raw:</b> {latest.powerDraw}W</div>}
                                        {"humidity" in latest && <div><b>Humidity:</b> {latest.humidity}%</div>}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="info-item">No IoT readings available.</div>
                        )}
                    </div>
                )}
                {modalType === "details" && currentView === "Service" && selected && (
                    <div className="modal-content">
                        <div className="info-row"><b>Name:</b> {selected.name}</div>
                        <div className="info-row"><b>Description:</b> {selected.description || "—"}</div>
                        <div className="info-row"><b>Type:</b> {selected.type}</div>
                        <div className="info-row"><b>Datacenter Location:</b> {selected.hostingDetails?.datacenterLocation || "—"}</div>

                        {/* Associated products */}
                        <h4>Associated Products</h4>
                        {(selected.associatedProducts || []).length > 0 ? (
                            Object.entries(
                                selected.associatedProducts.reduce((acc, prodId) => {
                                    acc[prodId] = (acc[prodId] || 0) + 1;
                                    return acc;
                                }, {})
                            ).map(([prodId, qty], idx) => {
                                const product = products.find((p) => p._id === prodId);
                                return (
                                    <div key={idx} className="info-item">
                                        {product ? product.name : prodId} — x{qty}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="info-item">No products linked.</div>
                        )}

                    </div>
                )}
{modalType === "details" && currentView === "Request" && selected && (
  <div className="modal-content">
    <div className="info-row"><b>Ticket Issue:</b> {selected.supportTicketId?.issue || "—"}</div>
    <div className="info-row"><b>Ticket Type:</b> {selected.supportTicketId?.type || "—"}</div>
    <div className="info-row"><b>Tag:</b> {selected.tag}</div>
    <div className="info-row"><b>Description:</b> {selected.description || "—"}</div>
    <div className="info-row"><b>Status:</b> {selected.status}</div>
    <div className="info-row"><b>Created At:</b> {new Date(selected.createdAt).toLocaleString()}</div>

    {selected.status === "pending" && (
      <div className="modal-actions">
        {/* ✅ Approve */}
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/request-change/${selected._id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
              });

              if (!res.ok) throw new Error("Failed to approve request");
              const data = await res.json();

              // ✅ update entities with new status
              setEntities((prev) =>
                prev.map((e) => (e._id === selected._id ? data.change : e))
              );

              setSelected(null);
              setModalType(null);
            } catch (err) {
              console.error(err);
              alert("Failed to approve request");
            }
          }}
        >
          ✅ Approve
        </button>

        {/* ❌ Not Approve */}
        <button
          className="danger-btn"
          onClick={async () => {
            try {
              const res = await fetch(`/api/request-change/${selected._id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "not_approved" }),
              });

              if (!res.ok) throw new Error("Failed to reject request");
              const data = await res.json();

              // ✅ update entities with new status
              setEntities((prev) =>
                prev.map((e) => (e._id === selected._id ? data.change : e))
              );

              setSelected(null);
              setModalType(null);
            } catch (err) {
              console.error(err);
              alert("Failed to reject request");
            }
          }}
        >
          ❌ Not Approve
        </button>
      </div>
    )}
  </div>
)}


                {/* EMPLOYEE ADD MODAL (example) */}
                {modalType === "employee" && (
                    <div className="modal-content">
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Name"
                                value={newEmployee.name}
                                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            />
                            {employeeErrors.name && <p className="error-text">{employeeErrors.name}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="email"
                                placeholder="Email"
                                value={newEmployee.email}
                                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            />
                            {employeeErrors.email && <p className="error-text">{employeeErrors.email}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="password"
                                placeholder="Password"
                                value={newEmployee.password}
                                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                            />
                            {employeeErrors.password && <p className="error-text">{employeeErrors.password}</p>}
                        </div>

                        <div className="form-field">
                            <select
                                value={newEmployee.role}
                                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                            >
                                <option value="" disabled>
                                    Choose a role
                                </option>
                                <option value="admin">Admin</option>
                                <option value="presales">Presales</option>
                                <option value="support">Support</option>
                                <option value="it">IT</option>
                            </select>
                            {employeeErrors.role && <p className="error-text">{employeeErrors.role}</p>}
                        </div>

                        {employeeErrors.general && <p className="error-text">{employeeErrors.general}</p>}
                        <div className="modal-actions">
                            <button onClick={handleSaveEmployee}>Save</button>
                        </div>
                    </div>
                )}
                {/* PRODUCT ADD MODAL */}
                {modalType === "product" && (
                    <div className="modal-content">
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Name *"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            {productErrors.name && <p className="error-text">{productErrors.name}</p>}
                        </div>

                        <div className="form-field">
                            <textarea
                                placeholder="Description"
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <select
                                value={newProduct.type}
                                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                            >
                                <option value="" disabled>Choose a type</option>
                                {["ai_model", "server", "storage", "network", "gpu", "cpu", "memory", "other"].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {productErrors.type && <p className="error-text">{productErrors.type}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Vendor"
                                value={newProduct.vendor}
                                onChange={(e) => setNewProduct({ ...newProduct, vendor: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <textarea
                                placeholder='Specifications (JSON), e.g. {"gpu":"A100"}'
                                value={specText}
                                onChange={(e) => setSpecText(e.target.value)}
                            />
                            {productErrors.specifications && <p className="error-text">{productErrors.specifications}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="number"
                                placeholder="Stock *"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                            />
                            {productErrors.stock && <p className="error-text">{productErrors.stock}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="number"
                                placeholder="Price *"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            />
                            {productErrors.price && <p className="error-text">{productErrors.price}</p>}
                        </div>

                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Serial Number"
                                value={newProduct.serialNumber}
                                onChange={(e) => setNewProduct({ ...newProduct, serialNumber: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Model"
                                value={newProduct.model}
                                onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                            />
                        </div>

                        {/* Location */}
                        <div className="form-row">
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="Datacenter"
                                    value={newProduct.location.datacenter}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, location: { ...newProduct.location, datacenter: e.target.value } })
                                    }
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="Rack"
                                    value={newProduct.location.rack}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, location: { ...newProduct.location, rack: e.target.value } })
                                    }
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="Position"
                                    value={newProduct.location.position}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, location: { ...newProduct.location, position: e.target.value } })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <select
                                value={newProduct.status}
                                onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                            >
                                {["available", "allocated", "maintenance", "retired", "faulty"].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        {["purchaseDate", "warrantyExpiry", "lastMaintenance", "nextMaintenance"].map((field) => (
                            <div className="form-field" key={field}>
                                <label>{field}</label>
                                <input
                                    type="date"
                                    value={newProduct[field] ? newProduct[field] : ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })}
                                />
                            </div>
                        ))}

                        <div className="form-field">
                            <textarea
                                placeholder="Notes"
                                value={newProduct.notes}
                                onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Tags (comma separated)"
                                value={newProduct.tags.join(", ")}
                                onChange={(e) =>
                                    setNewProduct({ ...newProduct, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })
                                }
                            />
                        </div>

                        {productErrors.general && <p className="error-text">{productErrors.general}</p>}
                        <div className="modal-actions">
                            <button onClick={handleSaveProduct}>Save</button>
                        </div>
                    </div>
                )}
                {modalType === "dc" && (
                    <div className="modal-content">
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Location"
                                value={newDC.location}
                                onChange={(e) => setNewDC({ ...newDC, location: e.target.value })}
                            />
                            {dcErrors.location && <p className="error-text">{dcErrors.location}</p>}
                        </div>

                        <div className="form-field">
                            <select
                                value={newDC.assetType}
                                onChange={(e) => setNewDC({ ...newDC, assetType: e.target.value })}
                            >
                                <option value="" disabled>Choose asset type</option>
                                <option value="server">Server</option>
                                <option value="storage">Storage</option>
                            </select>
                            {dcErrors.assetType && <p className="error-text">{dcErrors.assetType}</p>}
                        </div>

                        <div className="form-field">
                            <select
                                value={newDC.assetId}
                                onChange={(e) => setNewDC({ ...newDC, assetId: e.target.value })}
                            >
                                <option value="">Select Asset (Product)</option>
                                {products.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <select
                                value={newDC.customerId}
                                onChange={(e) => setNewDC({ ...newDC, customerId: e.target.value })}
                            >
                                <option value="">Select Customer</option>
                                {customers.map((c) => (
                                    <option key={c._id} value={c._id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>

                        {dcErrors.general && <p className="error-text">{dcErrors.general}</p>}
                        <div className="modal-actions">
                            <button onClick={handleSaveDC}>Save</button>
                        </div>
                    </div>
                )}
                {/* SERVICE ADD MODAL */}
                {modalType === "service" && (
                    <div className="modal-content">
                        {/* Service Name */}
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Service Name"
                                value={newService.name || ""}
                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                            />
                            {serviceErrors.name && <p className="error-text">{serviceErrors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="form-field">
                            <textarea
                                placeholder="Description"
                                value={newService.description || ""}
                                onChange={(e) =>
                                    setNewService({ ...newService, description: e.target.value })
                                }
                            />
                        </div>

                        {/* Type */}
                        <div className="form-field">
                            <select
                                value={newService.type || ""}
                                onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                            >
                                <option value="" disabled>
                                    Choose a type
                                </option>
                                <option value="ai_only">AI Only</option>
                                <option value="ai_hosted">AI Hosted</option>
                                <option value="infrastructure">Infrastructure</option>
                            </select>
                            {serviceErrors.type && <p className="error-text">{serviceErrors.type}</p>}
                        </div>

                        {/* Customer (optional) */}
                        <div className="form-field">
                            <select
                                value={newService.customerId || ""}
                                onChange={(e) =>
                                    setNewService({ ...newService, customerId: e.target.value })
                                }
                            >
                                <option value="">No customer</option>
                                {customers.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* IP Address (only if customer is chosen) */}
                        {newService.customerId && (
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="IP Address"
                                    value={newService.ipAddress || ""}
                                    onChange={(e) =>
                                        setNewService({ ...newService, ipAddress: e.target.value })
                                    }
                                />
                                {serviceErrors.ipAddress && (
                                    <p className="error-text">{serviceErrors.ipAddress}</p>
                                )}
                            </div>
                        )}

                        {/* Associated Products */}
                        <h4>Associated Products</h4>
                        {(newService.associatedProducts || []).map((p, idx) => (
                            <div className="form-field" key={idx} style={{ display: "flex", gap: "10px" }}>
                                <select
                                    value={p.productId || ""}
                                    onChange={(e) => {
                                        const updated = [...newService.associatedProducts];
                                        updated[idx].productId = e.target.value;
                                        setNewService({ ...newService, associatedProducts: updated });
                                    }}
                                >
                                    <option value="">Choose a product</option>
                                    {products.map((prod) => (
                                        <option key={prod._id} value={prod._id}>
                                            {prod.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Quantity"
                                    value={p.quantity || ""}
                                    onChange={(e) => {
                                        const updated = [...newService.associatedProducts];
                                        updated[idx].quantity = e.target.value;
                                        setNewService({ ...newService, associatedProducts: updated });
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = [...newService.associatedProducts];
                                        updated.splice(idx, 1);
                                        setNewService({ ...newService, associatedProducts: updated });
                                    }}
                                >
                                    ✕
                                </button>
                                {serviceErrors[`product-${idx}`] && (
                                    <p className="error-text">{serviceErrors[`product-${idx}`]}</p>
                                )}
                                {serviceErrors[`quantity-${idx}`] && (
                                    <p className="error-text">{serviceErrors[`quantity-${idx}`]}</p>
                                )}
                            </div>
                        ))}
                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() =>
                                    setNewService({
                                        ...newService,
                                        associatedProducts: [
                                            ...(newService.associatedProducts || []),
                                            { productId: "", quantity: 1 },
                                        ],
                                    })
                                }
                            >
                                + Add Product
                            </button>
                        </div>
                        {/* Datacenter Location */}
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Datacenter Location"
                                value={newService.datacenterLocation || ""}
                                onChange={(e) =>
                                    setNewService({ ...newService, datacenterLocation: e.target.value })
                                }
                            />
                        </div>

                        {/* VM Specs (JSON as string) */}
                        <div className="form-field">
                            <textarea
                                placeholder="VM Specs (JSON format)"
                                value={
                                    newService.vmSpecs
                                        ? JSON.stringify(newService.vmSpecs, null, 2)
                                        : ""
                                }
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setNewService({ ...newService, vmSpecs: parsed });
                                    } catch {
                                        setNewService({ ...newService, vmSpecs: {} });
                                    }
                                }}
                            />
                        </div>

                        {/* Errors (general) */}
                        {serviceErrors.general && (
                            <p className="error-text">{serviceErrors.general}</p>
                        )}
                        <div className="modal-actions">
                            <button onClick={handleSaveService}>Save</button>
                        </div>
                    </div>
                )}

                {/* Later you’ll add Product/DC/Service add modals here */}
            </Modal>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
