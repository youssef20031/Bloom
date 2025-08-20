import React from 'react';
import './login.style.css';
import { Mail, Lock, ChevronDown } from 'lucide-react';

export default function Login() {
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

          <form className="mt-8 space-y-6">
            <div>
              <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
              <div className="relative mt-1">
                <select id="role" className="form-input appearance-none">
                  <option>Enter Your Role</option>
                  <option>Admin</option>
                  <option>User</option>
                  <option>Guest</option>
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
                <input type="email" id="email" placeholder="Enter Your Email" className="form-input" />
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
                <input type="password" id="password" placeholder="Enter Your Password" className="form-input" />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 cta-button">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
