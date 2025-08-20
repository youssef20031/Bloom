import React from 'react';
import './signup.style.css';
import { User, Mail, Lock, Phone, MapPin, Globe, Map } from 'lucide-react';

export default function Signup() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-primary text-white p-12">
        <div className="text-center">
          <Globe className="mx-auto h-24 w-auto text-white" />
          <h1 className="text-5xl font-bold mt-4">BLOOM</h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Sign Up</h2>
          <p className="text-center text-gray-600 mt-2">
            Let's set you up! Sign up now to get to know our special bundles and consultation services.
          </p>

          <form className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-5 h-5 text-gray-400" />
                </span>
                <input type="text" id="name" placeholder="Enter Your Name" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                </span>
                <input type="email" id="email" placeholder="Enter Your Email" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type="password" id="password" placeholder="Enter Your Password" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type="password" id="confirm-password" placeholder="Confirm Password" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                </span>
                <input type="tel" id="phone" placeholder="+20 Enter Your Phone Number" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="street" className="text-sm font-medium text-gray-700">Address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </span>
                <input type="text" id="street" placeholder="Street" className="form-input pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input type="text" placeholder="Country" className="form-input pl-10" />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                </span>
              </div>
              <div className="relative">
                <input type="text" placeholder="City" className="form-input pl-10" />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Map className="w-5 h-5 text-gray-400" />
                </span>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 cta-button">
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
