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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="bg-transparent grid grid-cols-1 gap-4">
      <div className="overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 w-full max-w-[1440px] h-[896px] relative items-start">
        {/* Left side - Logo section */}
        <div className="absolute w-[382px] h-[641px] top-[140px] left-[125px] logo-image">
          <img
            className="absolute w-[357px] h-[498px] top-0 left-3"
            alt="Bloom logo illustration"
            src="https://c.animaapp.com/TRfIm5C2/img/frame-1984077454.svg"
          />
          <div className="absolute top-[497px] left-0 font-['Montserrat'] font-medium text-[#7086a4] text-8xl leading-[144px] whitespace-nowrap">
            BLOOM
          </div>
        </div>

        {/* Right side - Login form */}
        <main className="absolute w-[810px] h-full top-0 left-[630px] bg-white items-end">
          <div className="flex flex-col w-[589px] items-start gap-1 absolute top-[60px] left-[102px]">
            <h1 className="font-['Roboto'] font-bold text-[#1e3a61] text-4xl leading-tight">Login</h1>
            <p className="font-['Roboto'] font-normal text-[#1e3a61] text-lg leading-[27px]">
              Please choose your role down below and enter your credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="contents">
            {/* Role Selection */}
            <div className="flex flex-col w-[589px] items-start gap-4 absolute top-[179px] left-[102px]">
              <label className="font-['Roboto'] font-medium text-[#1e3a61] text-[22px] leading-[21px]">
                Role
              </label>
              <div className="flex items-center justify-between p-4 w-full bg-[#f0f0f0] rounded-xl">
                <div className="flex items-center gap-2">
                  <select
                    className="bg-transparent font-['Roboto'] font-normal text-[#656565] text-lg outline-none appearance-none"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                  >
                    <option value="" disabled>Enter Your Role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                  </select>
                  <ChevronDown className="w-6 h-6 text-[#656565] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Email and Password Fields */}
            <div className="flex flex-col w-[589px] items-start gap-8 absolute top-[304px] left-[102px]">
              {/* Email Field */}
              <div className="flex flex-col items-start gap-4 w-full">
                <label htmlFor="email-input" className="font-['Roboto'] font-medium text-[#1e3a61] text-[22px] leading-[21px]">
                  Email
                </label>
                <div className="flex w-full items-center gap-4 p-4 bg-[#f0f0f0] rounded-xl">
                  <Mail className="w-[30px] h-[30px] text-[#656565]" />
                  <input
                    id="email-input"
                    type="email"
                    className="flex-1 bg-transparent font-['Roboto'] font-normal text-[#656565] text-lg outline-none"
                    placeholder="Enter Your Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col items-start gap-4 w-full">
                <div className="flex justify-between items-center w-full">
                  <label htmlFor="password-input" className="font-['Roboto'] font-medium text-[#1e3a61] text-[22px] leading-[21px]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="font-['Roboto'] font-normal text-[#125ec9] text-lg underline bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => console.log('Forgot password clicked')}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex w-full items-center gap-4 p-4 bg-[#f0f0f0] rounded-xl">
                  <Lock className="w-[30px] h-[30px] text-[#656565]" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="flex-1 bg-transparent font-['Roboto'] font-normal text-[#656565] text-lg outline-none"
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="flex w-[593px] h-[66px] items-center justify-center gap-2 px-5 absolute top-[613px] left-[100px] bg-[#1e3a61] rounded-xl border border-solid border-[#1e3a61] cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="font-['Roboto'] font-normal text-white text-2xl leading-9">
                Login
              </span>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
