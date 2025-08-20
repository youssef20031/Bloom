import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  return (
    <>
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">BLOOM</div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
          <Link to="/services" className="text-gray-600 hover:text-gray-800">Services</Link>
          <a href="#" className="text-gray-600 hover:text-gray-800">Support</a>
          <a href="#" className="text-gray-600 hover:text-gray-800">More Info</a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-800">Login</Link>
          <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign Up</Link>
        </div>
        <button className="md:hidden">
          <i data-lucide="menu"></i>
        </button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
          Unlock the Power of <br /> AI for Everyone
        </h1>
        <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
          Discover tailored AI consultation services and robust hardware solutions designed for all users, whether you're a first-time visitor or a returning customer. Our intuitive platform connects you with the right resources to elevate your business.
        </p>
        <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
          Learn More
        </button>
      </main>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Unlock the Power of AI with Our Expert Consultation Services</h3>
              <p className="mt-2 text-gray-600">Our AI consultation services provide tailored solutions to elevate your business.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Manage Your Products with Our Customer Dashboard</h3>
              <p className="mt-2 text-gray-600">Easily monitor and manage your purchases with our intuitive dashboard.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">State-of-the-Art AI Hardware for Your Business Needs</h3>
              <p className="mt-2 text-gray-600">Streamline operations and enhance collaboration with our AI consultation.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Empower Your Team with Our AI Consultation and Training</h3>
              <p className="mt-2 text-gray-600">Our AI consultation services provide tailored solutions to elevate your business.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <button className="bg-transparent border border-blue-600 text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-600 hover:text-white transition">
              Explore
            </button>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Your Journey into AI Begins Here</h2>
          <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
            Getting started with our AI consultation or hardware purchase is simple and straightforward. Follow these easy steps to unlock the potential of AI for your business.
          </p>
          <div className="mt-12 grid md:grid-cols-3 gap-12">
            <div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold">1</div>
              <h3 className="mt-6 font-semibold text-xl text-gray-800">Explore Your Options</h3>
              <p className="mt-2 text-gray-600">Visit our website to browse our AI solutions and hardware offerings.</p>
            </div>
            <div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold">2</div>
              <h3 className="mt-6 font-semibold text-xl text-gray-800">Engage with Our Chatbot</h3>
              <p className="mt-2 text-gray-600">Use our chatbot to discuss your needs and receive tailored recommendations.</p>
            </div>
            <div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold">3</div>
              <h3 className="mt-6 font-semibold text-xl text-gray-800">Connect with Our Sales Team</h3>
              <p className="mt-2 text-gray-600">Our sales team will reach out to assist you further.</p>
            </div>
          </div>
          <div className="mt-12 space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
              Learn More
            </button>
            <button className="bg-gray-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-900">
              Sign Up &gt;
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="container mx-auto px-6 py-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold">Get Your Personalized AI Solutions</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Chat with our AI-powered assistant for tailored advice and solutions that meet your needs.
          </p>
          <div className="mt-8 space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100">
              Contact Us
            </button>
            <button className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-blue-600 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-white">BLOOM</h3>
              <p className="mt-4">Smarter AI for You</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">About BLOOM</h4>
              <ul className="mt-4 space-y-2">
                <li><Link to="#" className="hover:text-white">Our Company</Link></li>
                <li><Link to="#" className="hover:text-white">News</Link></li>
                <li><Link to="#" className="hover:text-white">Investor Relations</Link></li>
                <li><Link to="#" className="hover:text-white">Industries</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Products</h4>
              <ul className="mt-4 space-y-2">
                <li><Link to="#" className="hover:text-white">Enterprise</Link></li>
                <li><Link to="#" className="hover:text-white">Servers</Link></li>
                <li><Link to="#" className="hover:text-white">Storage</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Support</h4>
              <ul className="mt-4 space-y-2">
                <li><Link to="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white">Storage Support</Link></li>
                <li><Link to="#" className="hover:text-white">Servers Support</Link></li>
                <li><Link to="#" className="hover:text-white">Technical Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-6 text-center text-gray-500">
            <p>© 2025 BAISS. All rights reserved</p>
          </div>
        </div>
      </footer>

      {/* Initialize Lucide icons */}
      <script>window.lucide && window.lucide.createIcons();</script>
    </>
  );
}
