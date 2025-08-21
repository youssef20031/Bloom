import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/home";
import Services from "./pages/Services";
import Signup from "./pages/signup/signup";
import Login from "./pages/login/login";
import CustomerView from "./pages/customerview/customerview";
import ITDashboard from "./pages/IT";
import Adminview from "./pages/adminview/adminview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<CustomerView />} />
        <Route path="/it" element={<ITDashboard />} />
        <Route path="/admin" element={<Adminview />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
