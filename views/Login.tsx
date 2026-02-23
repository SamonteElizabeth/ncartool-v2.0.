import React, { useState } from 'react';
import { BarChart3, Check, ShieldCheck, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Role } from '../types';

interface LoginProps {
  onLogin: (role: Role) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('LEAD_AUDITOR');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate a brief loading state for "crafted" feel
    setTimeout(() => {
      onLogin(selectedRole);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-blue-400 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative group mb-6">
            <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="relative bg-white rounded-full flex items-center justify-center border-4 border-blue-400 shadow-2xl w-24 h-24">
              <div className="relative flex flex-col items-center justify-center">
                <BarChart3 className="w-10 h-10 text-blue-300 absolute -translate-y-1.5" />
                <Check className="w-14 h-14 text-[#3b82f6] absolute translate-y-1.5 font-black" strokeWidth={4} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#3b82f6] rounded-full border-2 border-white w-8 h-12 transform rotate-45"></div>
            </div>
          </div>
          <h1 className="font-black text-4xl text-white tracking-tighter">
            NCAR<span className="text-blue-100">Tool</span>
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/20 border border-white/10 p-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-400"></div>
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 font-medium mt-1">Please select your access role to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Access Role</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <ShieldCheck size={20} />
                </div>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3b82f6] focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="LEAD_AUDITOR">Lead Auditor</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="AUDITEE">Auditee</option>
                  <option value="DEV_ADMIN">Dev Admin</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ArrowRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3b82f6] focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 outline-none transition-all"
                  defaultValue="password123"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3b82f6] text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
