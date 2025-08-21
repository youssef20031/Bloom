import React, { useState } from 'react';
import './signup.style.css';
import { Phone, MapPin, Globe, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    street: '',
    city: '',
    country: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const { name, email, password, confirmPassword } = formData;
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/customers/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName: name,
          contactPerson: name,
          phone: formData.phoneNumber,
          address: { street: formData.street, city: formData.city, country: formData.country }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Signup failed');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-left-panel">
          <img
            className="signup-illustration"
            alt="Frame"
            src="https://c.animaapp.com/i4ADtoMw/img/frame-1984077454.svg"
          />
          <div className="signup-brand">BLOOM</div>
        </div>

        <div className="signup-right-panel">
          <form onSubmit={handleSubmit} className="signup-form">
            <header className="signup-header">
              <h1 className="signup-title">Sign Up</h1>
              <p className="signup-subtitle">
                Let's set you up! Sign up now to get to know our special
                bundles and consultation services.
              </p>
            </header>

            <div className="signup-fields">
              {/* Name field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="name-input">
                  Name
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <img
                      className="signup-input-icon"
                      alt="Profile"
                      src="https://c.animaapp.com/i4ADtoMw/img/profile.svg"
                    />
                    <input
                      id="name-input"
                      className="signup-input"
                      type="text"
                      placeholder="Enter Your Name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="email-input">
                  Email
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <img
                      className="signup-input-icon"
                      alt="Email"
                      src="https://c.animaapp.com/i4ADtoMw/img/email.svg"
                    />
                    <input
                      id="email-input"
                      className="signup-input"
                      type="email"
                      placeholder="Enter Your Email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="password-input">
                  Password
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <svg className="signup-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="#656565" strokeWidth="2" />
                      <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#656565" strokeWidth="2" />
                    </svg>
                    <input
                      id="password-input"
                      className="signup-input"
                      type="password"
                      placeholder="Enter Your Password"
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Password field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="confirm-password-input">
                  Confirm Password
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <svg className="signup-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="#656565" strokeWidth="2" />
                      <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#656565" strokeWidth="2" />
                    </svg>
                    <input
                      id="confirm-password-input"
                      className="signup-input"
                      type="password"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={e => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="phone-input">
                  Phone Number
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <Phone className="signup-input-icon" />
                    <div className="signup-country-code">
                      <select
                        className="signup-country-select"
                        defaultValue="+20"
                        onChange={e => handleInputChange('phoneNumber', e.target.value)}
                      >
                        <option value="+20">🇪🇬 +20</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                    </div>
                    <input
                      id="phone-input"
                      className="signup-input"
                      type="tel"
                      placeholder="Enter Your Phone Number"
                      value={formData.phoneNumber}
                      onChange={e => handleInputChange('phoneNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address field */}
              <div className="signup-field">
                <label className="signup-label" htmlFor="street-input">
                  Address
                </label>
                <div className="signup-input-wrapper">
                  <div className="signup-input-content">
                    <MapPin className="signup-input-icon" />
                    <input
                      id="street-input"
                      className="signup-input"
                      type="text"
                      placeholder="Street"
                      value={formData.street}
                      onChange={e => handleInputChange('street', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="signup-grid">
                {/* Country field */}
                <div className="signup-field">
                  <div className="signup-input-wrapper">
                    <div className="signup-input-content">
                      <Globe className="signup-input-icon" />
                      <input
                        className="signup-input"
                        type="text"
                        placeholder="Country"
                        value={formData.country}
                        onChange={e => handleInputChange('country', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* City field */}
                <div className="signup-field">
                  <div className="signup-input-wrapper">
                    <div className="signup-input-content">
                      <Map className="signup-input-icon" />
                      <input
                        className="signup-input"
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={e => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="signup-submit-btn">
              <span className="signup-submit-text">Sign Up</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
