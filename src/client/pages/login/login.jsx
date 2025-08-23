import React, { useState } from 'react';
import './login.style.css';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        // on success, store user and navigate based on role
        localStorage.setItem('user', JSON.stringify(data.user));
        const userRole = data.user.role;
        // Navigate based on role
        if (userRole === 'customer') {
          navigate('/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'presales') {
          // fallback for other roles
          navigate('/chatBot');
        }
        else {
            navigate('/');
        }
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  return (
      <div className="bg-transparent">
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 min-h-screen grid grid-cols-12">

              {/*
          LEFT SIDE - LOGO SECTION (CORRECTED)
          - The inner div is now a flex column, stacking the image and text vertically.
          - All absolute positioning and fixed heights are removed from the logo itself.
        */}
              <div className="col-span-6 flex items-center justify-center">
                  {/*
            CHANGED: This container now uses flexbox to arrange its children.
            REMOVED: No longer needs a fixed w/h or relative positioning.
          */}
                  <div className="logo-image flex flex-col items-center gap-4">
                      <img
                          // REMOVED: All absolute positioning classes are gone.
                          // We can set a width and let height be auto to maintain aspect ratio.
                          className="w-[357px] h-auto"
                          alt="Bloom logo illustration"
                          src="https://c.animaapp.com/TRfIm5C2/img/frame-1984077454.svg"
                      />
                      {/* REMOVED: All absolute positioning classes are gone. */}
                      <div className="font-['Montserrat'] font-medium text-[#7086a4] text-8xl leading-tight whitespace-nowrap">
                          BLOOM
                      </div>
                  </div>
              </div>

              {/* RIGHT SIDE - LOGIN FORM (This section remains the same) */}
              <main className="col-span-6 bg-white flex flex-col justify-center items-center p-16">
                  <div className="w-full max-w-lg">
                      <div className="mb-8">
                          <h1 className="font-['Roboto'] font-bold text-[#1e3a61] text-4xl leading-tight">Login</h1>
                          <p className="font-['Roboto'] font-normal text-[#1e3a61] text-lg leading-[27px]">
                              Enter your credentials to continue.
                          </p>
                          {error && (
                              <div className="mt-4">
                                  <p className="text-red-500 font-['Roboto'] text-lg">{error}</p>
                              </div>
                          )}
                      </div>

                      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
                                  <button
                                      type="button"
                                      // ADDED: background, padding, rounding
                                      // CHANGED: text color to white
                                      className="bg-[#1e3a61] text-white p-2 rounded-lg"
                                      onClick={() => setShowPassword(prev => !prev)}
                                  >
                                      {/* CHANGED: Icon size from w-6 h-6 to w-5 h-5 */}
                                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                  </button>
                              </div>
                          </div>

                          {/* Login Button */}
                          <button
                              type="submit"
                              className="flex w-full h-[66px] items-center justify-center gap-2 mt-6 bg-[#1e3a61] rounded-xl border border-solid border-[#1e3a61] cursor-pointer hover:opacity-90 transition-opacity"
                          >
                <span className="font-['Roboto'] font-normal text-white text-2xl leading-9">
                  Login
                </span>
                          </button>
                      </form>
                  </div>
              </main>
          </div>
      </div>
  );
}
