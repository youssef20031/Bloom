import React, { useState } from 'react';
import './login.style.css';
import { Mail, Lock, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!role || !email || !password) {
      setError('Please fill all fields');
      return;
    }
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        // on success, store user and navigate based on role
        localStorage.setItem('user', JSON.stringify(data.user));
        const userRole = data.user.role;
        if (userRole === 'customer') {
          navigate('/dashboard');
        } else {
          // fallback or other roles
          navigate('/');
        }
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-primary text-white p-12">
        <div className="text-center">
          <svg className="mx-auto h-24 w-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* ...icon paths... */}
          </svg>
          <h1 className="text-5xl font-bold mt-4">BLOOM</h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Login</h2>
          <p className="text-center text-gray-600 mt-2">
            Please choose your role down below and enter your credentials.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
              <div className="relative mt-1">
                <select id="role" className="form-input appearance-none" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                  <option value="guest">Guest</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                </span>
                <input type="email" id="email" placeholder="Enter Your Email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot Password?</a>
              </div>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type="password" id="password" placeholder="Enter Your Password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 cta-button">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
