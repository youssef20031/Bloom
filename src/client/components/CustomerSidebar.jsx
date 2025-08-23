import React from 'react';
import { Home, Briefcase, LifeBuoy, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * CustomerSidebar
 * Props:
 *  - userName: string
 *  - openTicketCount: number
 *  - current: 'overview' | 'services' | 'support' | 'info'
 *  - onLogout: () => void
 */
export default function CustomerSidebar({ userName = 'User', openTicketCount = 0, current = 'overview', onLogout }) {
  const navigate = useNavigate();

  const baseBtn = 'group flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden';
  const inactive = 'text-primary-200 hover:text-white hover:bg-white/10';
  const active = 'bg-white/10 text-white';

  return (
    <aside
      className="w-64 bg-primary-900 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-950 text-white flex-shrink-0 shadow-2xl relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, hsl(224,64%,33%), hsl(224,64%,33%) 10%, hsl(226,71%,40%) 55%, hsl(226,60%,23%) 100%)' }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-white to-transparent rounded-full translate-x-20 translate-y-20" />
      </div>
      <div className="relative z-10 p-6 border-b border-primary-700/50">
        <div className="flex items-center space-x-3">
          <img src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=80&q=60" alt="BLOOM Logo" className="w-10 h-10 rounded-lg shadow-lg ring-2 ring-white/20" />
          <span className="text-xl font-bold tracking-tight">BLOOM</span>
        </div>
      </div>
      <nav className="relative z-10 flex-1 p-4 space-y-2">
        <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3">Navigation</h3>
        <button onClick={() => navigate('/dashboard')} className={`${baseBtn} ${current==='overview'?active:inactive}`}> <Home className="w-5 h-5 mr-3" /> Overview </button>
        <button onClick={() => navigate('/services')} className={`${baseBtn} ${current==='services'?active:inactive}`}> <Briefcase className="w-5 h-5 mr-3" /> Services </button>
        <button onClick={() => navigate('/dashboard/support')} className={`${baseBtn} ${current==='support'?active:inactive}`}> <LifeBuoy className="w-5 h-5 mr-3" /> Support <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold min-w-[1.25rem] text-center" data-testid="text-open-tickets-count">{openTicketCount}</span></button>
        <button onClick={() => navigate('/dashboard/info')} className={`${baseBtn} ${current==='info'?active:inactive}`}> <Info className="w-5 h-5 mr-3" /> More Info </button>
      </nav>
      <div className="relative z-10 p-6 border-t border-primary-700/50">
        <div className="flex items-center space-x-3">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=60" alt="User Avatar" className="w-10 h-10 rounded-full ring-2 ring-white/30" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" data-testid="text-username">{userName}</p>
            <p className="text-xs text-primary-300">Customer</p>
          </div>
          <button className="p-2 text-primary-300 hover:text-white transition-colors" onClick={onLogout} data-testid="button-logout"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </aside>
  );
}

