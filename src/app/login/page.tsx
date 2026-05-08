'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  // Nếu đã đăng nhập từ trước, tự động chuyển hướng
  useEffect(() => {
    if (authLoading || !user) return;
    
    // Kiểm tra xem có phiên chơi không
    const checkSession = async () => {
      try {
        const data = await api.get(`/Session/active/${user.customerId}`);
        if (data && data.session) {
          router.push('/dashboard');
        } else {
          router.push('/areas');
        }
      } catch (err) {
        console.error('Check session error:', err);
        router.push('/areas');
      }
    };
    checkSession();
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/Auth/login', { username, password });
      login(response.token, response.user);

      // Kiểm tra xem người dùng có phiên chơi đang hoạt động không
      try {
        const data = await api.get(`/Session/active/${response.user.customerId}`);
        if (data && data.session) {
          // Có phiên đang chơi → vào thẳng trang chính
          router.push('/dashboard');
        } else {
          // Không có phiên → chọn máy
          router.push('/areas');
        }
      } catch (err) {
        console.error('Active session check error:', err);
        router.push('/areas');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-[500px] glass rounded-[48px] p-12 flex flex-col gap-10 relative z-10 animate-slide-up">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary/20">
            C
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter">CyberCore <span className="text-primary">Client</span></h1>
            <p className="text-muted font-bold mt-1 uppercase tracking-widest text-[10px]">Workstation Authentication</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">Username</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-4 rounded-2xl gap-4 focus-within:border-primary transition-all group">
              <User size={20} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Enter your username"
                className="bg-transparent border-none text-white outline-none w-full font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">Password</label>
            <div className="flex items-center bg-white/5 border border-white/10 p-4 rounded-2xl gap-4 focus-within:border-primary transition-all group">
              <Lock size={20} className="text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="bg-transparent border-none text-white outline-none w-full font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            className="neon-button bg-primary text-white flex items-center justify-center py-5 rounded-2xl mt-4 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Authenticating...' : 'Login to Session'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="flex justify-between items-center text-xs font-bold text-muted border-t border-white/5 pt-8">
            <a href="#" className="hover:text-white transition-colors">Forgot Password?</a>
            <Link href="/register" className="text-primary hover:underline">Register Account</Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
        Authorized Station • Secure Connection Verified
      </div>
    </div>
  );
}
