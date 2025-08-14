import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import CustomerDashboard from "./components/CustomerDashboard.jsx";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch demo user ID on component mount
  useEffect(() => {
    const fetchDemoUserId = async () => {
      try {
        const response = await fetch('/api/demo/populate', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setUserId(data.userId);
        } else {
          console.error('Failed to populate demo data');
        }
      } catch (error) {
        console.error('Error fetching demo user ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoUserId();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '1.2rem',
          color: '#6b7280'
        }}>
          Setting up demo data...
        </div>
      );
    }

    if (!userId) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '1.2rem',
          color: '#dc2626'
        }}>
          Failed to load demo data. Please check your MongoDB connection.
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <CustomerDashboard userId={userId} />;
      default:
        return <CustomerDashboard userId={userId} />;
    }
  };

  return (
    <div className="App">
      <nav className="app-nav">
        <div className="nav-brand">
          <img src={reactLogo} className="nav-logo" alt="Bloom Logo" />
          <h1>Bloom Services</h1>
        </div>
        <div className="nav-menu">
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </nav>
      
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
