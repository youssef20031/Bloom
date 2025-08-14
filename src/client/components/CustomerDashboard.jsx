import { useState, useEffect } from 'react';
import './CustomerDashboard.css';

const CustomerDashboard = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/dashboard/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'status-active' : 'status-expired';
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'ai_only':
        return '🤖';
      case 'ai_hosted':
        return '☁️';
      case 'infrastructure':
        return '🏗️';
      default:
        return '🔧';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <h3>No Data Available</h3>
        <p>Unable to load dashboard information.</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1>Welcome, {dashboardData.customer.contactPerson}</h1>
        <div className="company-info">
          <h2>{dashboardData.customer.companyName}</h2>
          <p>{dashboardData.customer.phone}</p>
          <p>{dashboardData.customer.address.street}, {dashboardData.customer.address.city}, {dashboardData.customer.address.country}</p>
        </div>
      </div>

      {/* Services Overview */}
      <div className="services-overview">
        <div className="overview-card">
          <h3>Total Services</h3>
          <span className="overview-number">{dashboardData.services.length}</span>
        </div>
        <div className="overview-card">
          <h3>Active Services</h3>
          <span className="overview-number">
            {dashboardData.services.filter(service => service.status === 'active').length}
          </span>
        </div>
        <div className="overview-card">
          <h3>Expired Services</h3>
          <span className="overview-number">
            {dashboardData.services.filter(service => service.status === 'expired').length}
          </span>
        </div>
      </div>

      {/* Services List */}
      <div className="services-section">
        <h2>Your Services</h2>
        {dashboardData.services.length === 0 ? (
          <div className="no-services">
            <p>You haven't purchased any services yet.</p>
          </div>
        ) : (
          <div className="services-grid">
            {dashboardData.services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <span className="service-icon">{getServiceTypeIcon(service.type)}</span>
                  <div className="service-title">
                    <h3>{service.name}</h3>
                    <span className={`service-status ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
                
                <div className="service-details">
                  <p className="service-description">{service.description}</p>
                  
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{service.type.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Purchase Date:</span>
                    <span className="detail-value">{formatDate(service.purchaseDate)}</span>
                  </div>
                  
                  {service.ipAddress && (
                    <div className="detail-row">
                      <span className="detail-label">IP Address:</span>
                      <span className="detail-value ip-address">{service.ipAddress}</span>
                    </div>
                  )}
                  
                  {service.datacenterLocation && service.datacenterLocation !== 'N/A' && (
                    <div className="detail-row">
                      <span className="detail-label">Datacenter:</span>
                      <span className="detail-value">{service.datacenterLocation}</span>
                    </div>
                  )}
                  
                  {service.vmSpecs && Object.keys(service.vmSpecs).length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">VM Specs:</span>
                      <span className="detail-value">
                        {Object.entries(service.vmSpecs).map(([key, value]) => (
                          <span key={key} className="vm-spec">
                            {key}: {value}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="service-actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => setSelectedService(service)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedService.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedService(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>Service Information</h3>
                <p><strong>Description:</strong> {selectedService.description}</p>
                <p><strong>Type:</strong> {selectedService.type.replace('_', ' ')}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${getStatusColor(selectedService.status)}`}>
                    {selectedService.status}
                  </span>
                </p>
                <p><strong>Purchase Date:</strong> {formatDate(selectedService.purchaseDate)}</p>
              </div>
              
              {selectedService.ipAddress && (
                <div className="modal-section">
                  <h3>Network Details</h3>
                  <p><strong>IP Address:</strong> 
                    <span className="ip-address">{selectedService.ipAddress}</span>
                  </p>
                </div>
              )}
              
              {selectedService.datacenterLocation && selectedService.datacenterLocation !== 'N/A' && (
                <div className="modal-section">
                  <h3>Infrastructure Details</h3>
                  <p><strong>Datacenter Location:</strong> {selectedService.datacenterLocation}</p>
                  {selectedService.vmSpecs && Object.keys(selectedService.vmSpecs).length > 0 && (
                    <div>
                      <strong>VM Specifications:</strong>
                      <ul className="vm-specs-list">
                        {Object.entries(selectedService.vmSpecs).map(([key, value]) => (
                          <li key={key}><strong>{key}:</strong> {value}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedService(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard; 