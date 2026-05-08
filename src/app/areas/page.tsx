'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, ArrowRight, Star, Monitor, Zap } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface Room {
  roomId: number;
  name: string;
  type: string;
  pricePerHour: number;
  imageUrl: string;
}

export default function AreaSelection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    api.get('/Room')
      .then(data => {
        setRooms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user, router]);

  const handleRoomSelect = async (room: Room) => {
    setLoading(true);
    setSelectedRoom(room);
    try {
      const allComputers = await api.get('/Computer');
      // Filter computers by room and sort by name
      const roomComputers = allComputers
        .filter((c: any) => c.roomId === room.roomId)
        .sort((a: any, b: any) => a.computerName.localeCompare(b.computerName, undefined, { numeric: true, sensitivity: 'base' }));
      setComputers(roomComputers);
    } catch (err) {
      console.error('Failed to fetch computers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComputerSelect = async (computer: any) => {
    if (computer.status !== 'Available') {
      alert('Máy này đang bận rồi!');
      return;
    }

    if (!user) return;

    setIsStarting(true);
    try {
      const sessionData = {
        customerId: user.customerId,
        computerId: computer.computerId,
        hourlyRate: selectedRoom?.pricePerHour || 0,
        status: 'Playing'
      };

      await api.post('/Session/start', sessionData);
      
      alert(`Đã kích hoạt máy ${computer.computerName}! Chúc bạn chơi game vui vẻ.`);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to start session:', err);
      alert(`Lỗi khi bắt đầu phiên chơi: ${(err as any).message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full"></div>

      <div className="relative z-10 container mx-auto px-8 py-16 h-full flex flex-col gap-12">
        <header className="flex flex-col gap-2 animate-slide-up">
          <div className="flex items-center gap-4">
            {selectedRoom && (
              <button 
                onClick={() => setSelectedRoom(null)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-6xl font-black tracking-tighter">
              {selectedRoom ? <>Select <span className="text-primary">Station</span></> : <>Choose Your <span className="text-primary">Experience</span></>}
            </h1>
          </div>
          <p className="text-muted text-lg font-bold">
            {selectedRoom ? `Available machines in ${selectedRoom.name}` : `Select an area to start your gaming session.`}
          </p>
        </header>

        {selectedRoom ? (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {computers.map((comp) => (
              <div 
                key={comp.computerId}
                onClick={() => handleComputerSelect(comp)}
                className={`
                  p-6 rounded-3xl glass flex flex-col items-center gap-4 transition-all border-2
                  ${comp.status === 'Available' 
                    ? 'cursor-pointer hover:border-primary/50 border-transparent hover:scale-105' 
                    : 'opacity-50 grayscale border-transparent cursor-not-allowed'}
                `}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${comp.status === 'Available' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted'}`}>
                  <Monitor size={32} />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black uppercase tracking-tight">{comp.computerName}</h4>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${comp.status === 'Available' ? 'text-green-500' : 'text-red-500'}`}>
                    {comp.status}
                  </span>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up [animation-delay:200ms]">
            {rooms.map((room) => (
              <div 
                key={room.roomId}
                onClick={() => handleRoomSelect(room)}
                className="group relative rounded-[40px] overflow-hidden glass cursor-pointer hover:border-primary/50 transition-all duration-500"
              >
                {/* Image with overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" 
                  style={{ backgroundImage: `url(${room.imageUrl})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent group-hover:via-background/20 transition-all duration-500"></div>

                <div className="relative h-full p-10 flex flex-col justify-end gap-4 z-20">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      {room.type === 'VIP' && <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Star size={10} fill="currentColor" /> Premium</span>}
                      {room.type === 'Pro' && <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor" /> Pro Stream</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black tracking-tight">{room.name}</h3>
                    <div className="flex items-center gap-6 text-sm font-bold text-muted mt-2">
                       <span className="flex items-center gap-2"><Monitor size={16} /> RTX 4090</span>
                       <span className="flex items-center gap-2"><Star size={16} /> 360Hz</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted uppercase tracking-widest">Pricing</span>
                      <span className="text-2xl font-black text-white">{room.pricePerHour.toLocaleString()} <span className="text-sm font-bold text-muted">VND/hr</span></span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
