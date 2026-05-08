'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, ArrowLeft, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/Auth/register', { 
        fullname, 
        username, 
        password 
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-[500px] glass rounded-[48px] p-12 flex flex-col items-center gap-6 relative z-10 animate-bounce-slow">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/20">
            <BadgeCheck size={48} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter text-white">Registration <span className="text-green-500">Successful!</span></h1>
            <p className="text-muted font-bold mt-2">Welcome aboard. Redirecting to login...</p>
            <div className="mt-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-black animate-pulse">
              🎁 30 PHÚT GIỜ CHƠI MIỄN PHÍ ĐÃ ĐƯỢC TẶNG!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-[500px] glass rounded-[48px] p-12 flex flex-col gap-8 relative z-10 animate-slide-up">
        <div className="flex flex-col items-center gap-4">
          <Link href="/login" className="self-start mb-2 group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted hover:text-white transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter">Create <span className="text-primary">Account</span></h1>
            <p className="text-muted font-bold mt-1 uppercase tracking-widest text-[10px]">Join CyberCore Network</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Full Name</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-3.5 rounded-2xl gap-3 focus-within:border-primary transition-all group">
              <User size={18} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="John Doe"
                required
                className="bg-transparent border-none text-white outline-none w-full font-bold text-sm"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Username</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-3.5 rounded-2xl gap-3 focus-within:border-primary transition-all group">
              <User size={18} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="johndoe123"
                required
                className="bg-transparent border-none text-white outline-none w-full font-bold text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Password</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-3.5 rounded-2xl gap-3 focus-within:border-primary transition-all group">
              <Lock size={18} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="••••••••"
                required
                className="bg-transparent border-none text-white outline-none w-full font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Confirm Password</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-3.5 rounded-2xl gap-3 focus-within:border-primary transition-all group">
              <Lock size={18} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="••••••••"
                required
                className="bg-transparent border-none text-white outline-none w-full font-bold text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="neon-button bg-primary text-white flex items-center justify-center py-4.5 rounded-2xl mt-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-2" />
          </button>
        </form>

        <div className="text-center text-xs font-bold text-muted mt-2">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}
