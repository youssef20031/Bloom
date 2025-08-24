import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/home";
import Services from "./pages/Services";
import Signup from "./pages/signup/signup";
import Login from "./pages/login/login";
import CustomerView from "./pages/customerview/customerview";
import ITDashboard from "./pages/IT";
import Adminview from "./pages/adminview/adminview";
import ChatBot from "./pages/chatBot/index.jsx";
import Support from "./pages/Support/index.jsx";
import MqttLiveDashboard from "./pages/IT/index.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/support" element={<Support />} />
        <Route path="/" element={<MqttLiveDashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="/dashboard/overview" element={<CustomerView initialSection="overview" />} />
        <Route path="/dashboard/support" element={<CustomerView initialSection="support" />} />
        <Route path="/dashboard/billing" element={<CustomerView initialSection="billing" />} />
        <Route path="/dashboard/orders" element={<CustomerView initialSection="orders" />} />
        <Route path="/dashboard/info" element={<CustomerView initialSection="info" />} />
        <Route path="/it" element={<ITDashboard />} />
        <Route path="/admin" element={<Adminview />} />
        <Route path="/chatBot" element={<ChatBot />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
