import React from 'react';
import './customerview.style.css';
import { Home, Briefcase, LifeBuoy, Info, Bell, Plus } from 'lucide-react';

export default function CustomerView() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex-shrink-0">
        <div className="p-6 text-2xl font-bold">BLOOM</div>
        <nav className="mt-8">
          <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
            <Home className="w-5 h-5 mr-3" /> Home
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
            <Briefcase className="w-5 h-5 mr-3" /> Services
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
            <LifeBuoy className="w-5 h-5 mr-3" /> Support
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800">
            <Info className="w-5 h-5 mr-3" /> More Info
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back, Ali</h1>
          <div className="flex items-center space-x-4">
            <Bell className="text-gray-500" />
            <img src="https://i.pravatar.cc/40" alt="User Avatar" className="w-10 h-10 rounded-full" />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <h3 className="text-gray-500">Storage Used</h3>
            <p className="text-3xl font-bold">29 TB</p>
          </div>
          <div className="stat-card">
            <h3 className="text-gray-500">Storage Remaining</h3>
            <p className="text-3xl font-bold">16 TB</p>
          </div>
          <div className="stat-card">
            <h3 className="text-gray-500">Performance</h3>
            <p className="text-3xl font-bold text-green-500">97%</p>
          </div>
          <div className="stat-card">
            <h3 className="text-gray-500">Completed</h3>
            <p className="text-3xl font-bold">66%</p>
            <p className="text-sm text-gray-400">As of 08/12/2025</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
            <button className="flex items-center text-blue-600 hover:underline">
              Expand <Plus className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4">Order Name</th>
                  <th className="py-3 px-4">Date Purchased</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4">Dell PowerShell</td>
                  <td className="py-3 px-4">April 10, 2025</td>
                  <td className="py-3 px-4"><span className="status-completed">Completed</span></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Data Server</td>
                  <td className="py-3 px-4">May 27, 2025</td>
                  <td className="py-3 px-4"><span className="status-progress">In Progress</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Order Name</td>
                  <td className="py-3 px-4">June 6, 2025</td>
                  <td className="py-3 px-4"><span className="status-delayed">Delayed</span></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Order Name</td>
                  <td className="py-3 px-4">June 12, 2025</td>
                  <td className="py-3 px-4"><span className="status-completed">Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

