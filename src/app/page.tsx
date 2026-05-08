'use client';

import { useEffect, useState } from 'react';
import { Home, Coffee, MessageSquare, Shield, LogOut, User, Clock } from 'lucide-react';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import SupportChat from '@/components/SupportChat';

export default function UserStationPage() {
  const { user, logout, loading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [timePlayed, setTimePlayed] = useState('00:00:00');
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

  // Authentication Guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [basePlayedSeconds, setBasePlayedSeconds] = useState<number>(0);

  useEffect(() => {
    if (loading || !user) return;

    // Fetch active session for the logged in user
    console.log('Fetching session for customerId:', user.customerId);
    api.get(`/Session/active/${user.customerId}`)
      .then(data => {
        console.log('Session data response:', data);
        if (data && data.session) {
          setSession(data.session);
          setBasePlayedSeconds(data.playedSeconds || 0);
        } else {
          console.warn('No session in response, forcing redirect to /areas');
          window.location.href = '/areas'; // Dùng window.location để force reload nếu router.push bị kẹt
        }
      })
      .catch(err => {
        console.error('Session fetch failed:', err);
        // Nếu không có phiên chơi, bắt buộc quay lại trang chọn máy
        window.location.href = '/areas';
      });

    // Fetch services
    api.get('/Service')
      .then(data => {
        setPopularServices(data.slice(0, 3));
      })
      .catch(err => console.error('Failed to fetch services:', err));
  }, [user, loading, router]);

  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [liveRemainingTime, setLiveRemainingTime] = useState<number | null>(null);
  const [liveComboTime, setLiveComboTime] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;

    let secondsElapsed = basePlayedSeconds;

    const tick = () => {
      secondsElapsed++;
      const hours = Math.floor(secondsElapsed / 3600);
      const minutes = Math.floor((secondsElapsed % 3600) / 60);
      const seconds = Math.floor(secondsElapsed % 60);
      setTimePlayed([hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':'));
    };

    const timer = setInterval(tick, 1000);

    const heartbeatPoll = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(API_BASE_URL + '/Session/heartbeat', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveBalance(data.balance);
          setLiveRemainingTime(data.remainingTime);
          setLiveComboTime(data.comboTime);
        }
      } catch (e) {
        console.error('Heartbeat error:', e);
      }
    }, 60000);

    return () => { clearInterval(timer); clearInterval(heartbeatPoll); };
  }, [session]);

  if (loading || !user) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"></div>
        <div className="text-primary animate-pulse font-black text-2xl uppercase tracking-[0.2em] relative z-10">
          Authenticating...
        </div>
      </div>
    );
  }

  const handleEndSession = async () => {
    console.log('DEBUG: Current session state:', session);
    const sId = session?.sessionId || session?.SessionId;
    console.log('DEBUG: Resolved sId:', sId);
    
    if (!sId) {
      alert('Không tìm thấy ID phiên chơi! Vui lòng tải lại trang.');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên chơi không?')) return;

    try {
      await api.put(`/Session/end/${sId}`);
      alert('Đã kết thúc phiên chơi thành công!');
      logout();
    } catch (err) {
      console.error('Failed to end session:', err);
      alert('Có lỗi xảy ra khi kết thúc phiên chơi.');
    }
  };

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('mì') || n.includes('ramen')) return '🍜';
    if (n.includes('cơm') || n.includes('rice')) return '🍚';
    if (n.includes('burger') || n.includes('bánh')) return '🍔';
    if (n.includes('nước') || n.includes('sting') || n.includes('drink')) return '🥤';
    if (n.includes('xúc xích') || n.includes('sausage')) return '🌭';
    return '🍱';
  };

  return (
    <div className="flex h-screen w-screen bg-[url('https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md"></div>

      <div className="relative z-10 flex flex-1 p-8 gap-8">
        {/* Sidebar Container */}
        <div className="flex flex-col w-[380px] gap-6 animate-slide-up">
          {/* Profile Card */}
          <div className="p-8 rounded-[32px] glass-premium flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-500"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <User size={28} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tight">{user.fullname}</h2>
                <span className="text-xs text-muted font-bold uppercase tracking-widest">@{user.username}</span>
              </div>
            </div>

            <div className="h-[1px] bg-white/5 w-full"></div>

            {/* Main Balance - Money */}
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Số dư tài khoản</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-black text-primary tracking-tighter drop-shadow-sm">
                  {(liveBalance ?? user.balance ?? 0).toLocaleString()}
                </h3>
                <span className="text-sm font-bold text-muted">VND</span>
              </div>
            </div>

            {/* Session Timer - Premium Display */}
            <div className="flex flex-col gap-1 p-6 rounded-[24px] bg-white/5 border border-white/10 relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-1">Thời gian đã sử dụng</span>
                <div className="flex items-center gap-3">
                    <Clock className="text-primary animate-pulse" size={32} />
                    <h3 className="text-4xl font-mono font-black text-white tracking-[0.1em]">
                        {timePlayed}
                    </h3>
                </div>
            </div>

            {/* Combo Section */}
            {((liveComboTime ?? user.comboTime) ?? 0) > 0 && (
                <div className="flex flex-col gap-2 p-5 rounded-[24px] bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 relative overflow-hidden group">
                    <div className="absolute top-[-50%] right-[-20%] w-32 h-32 bg-secondary/20 blur-[40px] rounded-full"></div>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                        <Shield size={14} fill="currentColor" /> COMBO ĐANG HOẠT ĐỘNG
                    </span>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white">
                        {Math.floor((liveComboTime ?? user.comboTime) ?? 0)}
                        </h3>
                        <span className="text-xs font-bold text-secondary">Phút</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-secondary h-full animate-shimmer" style={{ width: '70%' }}></div>
                    </div>
                </div>
            )}

            {/* Remaining Time (Bonus/Small packages) */}
            {((liveRemainingTime ?? user.remainingTime) ?? 0) > 0 && (
              <div className="flex flex-col gap-1 px-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                   Bonus: {Math.floor((liveRemainingTime ?? user.remainingTime) ?? 0)} Phút còn lại
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
              <button 
                onClick={() => router.push('/menu')}
                className="neon-button bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-white shadow-lg shadow-primary/10"
              >
                <Coffee size={24} />
                <span>Dịch vụ & Đồ ăn</span>
              </button>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="neon-button bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                <MessageSquare size={24} />
                <span>Hỗ trợ</span>
              </button>
              <button 
                onClick={handleEndSession}
                className="neon-button bg-danger/20 border border-danger text-danger hover:bg-danger hover:text-white mt-auto"
              >
                <LogOut size={24} />
                <span>Kết thúc phiên</span>
              </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-8 animate-slide-up [animation-delay:200ms]">
          <header className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-5xl font-black tracking-tighter">Chào mừng tới <span className="text-primary">CYBERCORE</span></h1>
              <p className="text-muted font-bold mt-2">
                Máy đang dùng: <span className="text-white">{session?.computer?.computerName || '...'}</span> • 
                Khu vực: <span className="text-white">{session?.computer?.room?.name || '...'}</span>
              </p>
            </div>
            <div className="text-right">
                <h4 className="text-4xl font-black tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                <p className="text-muted font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-2 gap-8">
            <div className="p-8 rounded-[32px] glass flex flex-col justify-end gap-2 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent group-hover:via-background/20 transition-all duration-500"></div>
                <div className="relative z-10">
                    <span className="bg-primary px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Promotions</span>
                    <h3 className="text-2xl font-black mt-2 leading-tight">Double Balance This Weekend!</h3>
                    <p className="text-sm text-muted">Top up $10 and get $20 added to your account instantly.</p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <div className="p-8 rounded-[30px] glass bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
                    <div className="flex items-center gap-3 text-secondary mb-3">
                        <Shield size={24} />
                        <h4 className="font-black uppercase tracking-widest text-sm">Hardware Specs</h4>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm font-bold text-muted">
                        <li>CPU: Intel Core i9-13900K</li>
                        <li>GPU: NVIDIA RTX 4090 24GB</li>
                        <li>RAM: 64GB DDR5 6000MHz</li>
                        <li>Monitor: 360Hz Gaming Display</li>
                    </ul>
                </div>

                <div className="p-8 rounded-[30px] glass">
                    <h4 className="font-black uppercase tracking-widest text-sm text-muted mb-4">Popular Services</h4>
                    <div className="flex gap-4">
                        {popularServices.length > 0 ? popularServices.map((svc) => (
                          <div 
                            key={svc.serviceId} 
                            onClick={() => router.push('/menu')}
                            className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 cursor-pointer transition-all"
                          >
                              <span className="text-3xl">{getServiceIcon(svc.name)}</span>
                              <span className="text-[10px] font-black text-center leading-tight uppercase tracking-tight">{svc.name}</span>
                              <span className="text-[9px] font-bold text-primary">{svc.price.toLocaleString()}đ</span>
                          </div>
                        )) : (
                          <div className="flex-1 text-center py-4 text-muted text-xs font-bold italic">Loading services...</div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      {user && (
        <SupportChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          customerId={user.customerId} 
          username={user.username} 
        />
      )}
    </div>
  );
}
