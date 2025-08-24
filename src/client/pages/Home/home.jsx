import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Grid3X3,
  Shield,
  Monitor,
  HelpCircle,
  MessageCircle,
  Handshake,
  Menu,
  Sprout
} from "lucide-react";
import './home.css';

export default function Home() {
  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="https://c.animaapp.com/i4ADtoMw/img/frame-1984077454.svg" alt="Bloom Logo Illustration" className="logo-img mr-3 w-6 h-6" />
              <div className="text-2xl font-bold text-gray-800">BLOOM</div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" data-testid="nav-home">
              Home
            </Link>
            <Link to="/services" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" data-testid="nav-services">
              Services
            </Link>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" data-testid="nav-support">
              Support
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" data-testid="nav-more">
              More info
            </a>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium" data-testid="button-login">
              Login
            </Link>
            <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium" data-testid="button-signup">
              Sign Up
            </Link>
          </div>
          <button className="md:hidden text-gray-600 hover:text-blue-600" data-testid="button-mobile-menu">
            <Menu className="text-xl" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-900 min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" data-testid="text-hero-title">
              Unlock the Power of<br />
              <span className="text-blue-400">AI for Everyone</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed" data-testid="text-hero-description">
              Discover tailored AI consultation services and robust hardware solutions designed for all users, whether you're a first-time visitor or a returning customer. Our intuitive platform connects you with the right resources to elevate your business.
            </p>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg" data-testid="button-hero-learn-more">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4" data-testid="text-services-heading">
              Unlock the Power of AI with Our Expert<br />Consultation Services
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center" data-testid="card-service-dashboard">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Grid3X3 className="text-blue-600 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl text-gray-800 mb-4" data-testid="text-service-title-dashboard">
                Manage Your Products with Our Customer Dashboard
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6" data-testid="text-service-description-dashboard">
                Easily monitor and manage your purchases with our intuitive dashboard.
              </p>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" data-testid="link-service-signup">
                Sign Up
              </a>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center" data-testid="card-service-hardware">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-blue-600 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl text-gray-800 mb-4" data-testid="text-service-title-hardware">
                State-of-the-Art AI Hardware for Your Business Needs
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6" data-testid="text-service-description-hardware">
                Our AI consultation services provide tailored solutions to elevate your business.
              </p>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" data-testid="link-service-explore">
                Explore
              </a>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center" data-testid="card-service-training">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="text-blue-600 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl text-gray-800 mb-4" data-testid="text-service-title-training">
                Empower Your Team with Our AI Consultation and Training
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6" data-testid="text-service-description-training">
                Streamline operations and enhance collaboration with our AI consultation.
              </p>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" data-testid="link-service-learn-more">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6" data-testid="text-journey-heading">
              Your Journey into AI Begins Here
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed" data-testid="text-journey-description">
              Getting started with our AI consultation or hardware purchase is simple and straightforward. Follow these easy steps to unlock the potential of AI for your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center" data-testid="step-explore">
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                  <HelpCircle />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4" data-testid="text-step-title-explore">
                Step 1: Explore Your Options
              </h3>
              <p className="text-gray-600 leading-relaxed" data-testid="text-step-description-explore">
                Visit our website to browse our AI solutions and hardware offerings.
              </p>
            </div>

            <div className="text-center" data-testid="step-engage">
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                  <MessageCircle />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4" data-testid="text-step-title-engage">
                Step 2: Engage with Our Chatbot
              </h3>
              <p className="text-gray-600 leading-relaxed" data-testid="text-step-description-engage">
                Use our chatbot to discuss your needs and receive tailored recommendations.
              </p>
            </div>

            <div className="text-center" data-testid="step-connect">
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                  <Handshake />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4" data-testid="text-step-title-connect">
                Step 3: Connect with Our Sales Team
              </h3>
              <p className="text-gray-600 leading-relaxed" data-testid="text-step-description-connect">
                Our sales team will reach out to assist you further.
              </p>
            </div>
          </div>

          <div className="text-center mt-16 space-x-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg" data-testid="button-journey-learn-more">
              Learn More
            </button>
            <button className="bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200" data-testid="button-journey-signup">
              Sign Up →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" data-testid="text-cta-heading">
            Get Your Personalized AI Solutions
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed" data-testid="text-cta-description">
            Chat with our AI-powered assistant for tailored advice and solutions that meet your needs.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg" data-testid="button-cta-contact">
              Contact Us
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200" data-testid="button-cta-learn-more">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                  <img src="https://c.animaapp.com/i4ADtoMw/img/frame-1984077454.svg" alt="Bloom Logo Illustration" className="logo-img mar mr-3" />
                <h3 className="text-2xl font-bold text-white">BLOOM</h3>
              </div>
              <p className="text-gray-400">Smarter AI for You</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">About BLOOM</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-white">Our Company</Link></li>
                <li><Link to="#" className="hover:text-white">News</Link></li>
                <li><Link to="#" className="hover:text-white">Investor Relations</Link></li>
                <li><Link to="#" className="hover:text-white">Industries</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Products</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-white">Enterprise</Link></li>
                <li><Link to="#" className="hover:text-white">Servers</Link></li>
                <li><Link to="#" className="hover:text-white">Storage</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white">Storage Support</Link></li>
                <li><Link to="#" className="hover:text-white">Servers Support</Link></li>
                <li><Link to="#" className="hover:text-white">Technical Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-500 text-sm">© 2025 BAISS. All rights reserved</p>
          </div>
        </div>
      </footer>
    </>
  );
}