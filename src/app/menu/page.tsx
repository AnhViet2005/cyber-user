'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, API_BASE_URL, BASE_URL } from '@/lib/api';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Search, 
  Plus, 
  Coffee, 
  Utensils, 
  Zap, 
  LayoutGrid, 
  Clock, 
  CreditCard, 
  Moon,
  SlidersHorizontal,
  ChevronDown,
  X,
  Trash2,
  Minus,
  ShoppingBag,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function MenuPage() {
  const [services, setServices] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Food');
  const [activeSubCategory, setActiveSubCategory] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [note, setNote] = useState(""); // 👈 Thêm state ghi chú
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash | Transfer
  const [activeOrders, setActiveOrders] = useState<any[]>([]); // To track order progress

  const handleCheckout = async () => {
    if (!session || cart.length === 0) return;

    try {
      // 1. Tạo Order
      const orderRes = await api.post('/Order', {
        sessionId: session.sessionId,
        orderTime: new Date().toISOString()
      });

      // 2. Tạo OrderDetails cho từng món
      const detailsPromises = cart.map(item => 
        api.post('/OrderDetail', {
          orderId: orderRes.orderId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          price: item.price
        })
      );

      await Promise.all(detailsPromises);

      // 3. Nếu là chuyển khoản, có thể hiện thông báo hoặc QR (giả lập)
      if (paymentMethod === 'Transfer') {
        alert('Vui lòng quét mã QR tại máy để thanh toán chuyển khoản!');
      }

      setCart([]);
      setIsCartOpen(false);
      localStorage.removeItem('cart');
      fetchActiveOrders(); // Refresh progress list
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Có lỗi xảy ra khi đặt món. Vui lòng thử lại!');
    }
  };

  const sidebarGroups = [
    {
      title: 'ĐỒ ĂN & ĐỒ UỐNG',
      items: [
        { id: 'Food', name: 'Đồ Ăn', icon: Utensils, color: 'text-orange-500' },
        { id: 'Drinks', name: 'Đồ Uống', icon: Coffee, color: 'text-blue-500' },
        { id: 'Combos', name: 'Combo', icon: LayoutGrid, color: 'text-purple-500', badge: 'NEW' },
      ]
    },
    {
      title: 'THẺ CÀO & GIỜ CHƠI',
      items: [
        { id: 'Time', name: 'Giờ Chơi', icon: Clock, color: 'text-emerald-500' },
        { id: 'Cards', name: 'Thẻ Cào', icon: CreditCard, color: 'text-sky-500' },
        { id: 'Packages', name: 'Gói Giờ Chơi', icon: Moon, color: 'text-amber-500' },
      ]
    },
    {
      title: 'CÁ NHÂN',
      items: [
        { id: 'History', name: 'Lịch sử đặt món', icon: History, color: 'text-rose-500' },
      ]
    }
  ];

  useEffect(() => {
    // 1. Load Cart from LocalStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }

    // 2. Fetch Session Info
    if (user) {
      const cid = (user as any).customerId || (user as any).CustomerId;
      if (cid) {
        api.get(`/Session/active/${cid}`)
          .then(data => setSession(data))
          .catch(err => console.error('Failed to fetch session:', err));
      }
    }

    // 3. Fetch Services
    setLoading(true);
    api.get('/Service')
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch services:', err);
        setLoading(false);
      });
    // 4. Fetch Active Orders
    fetchActiveOrders();

    // Poll orders every 30 seconds for progress updates
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchActiveOrders = async () => {
    if (!user) return;
    try {
      const cid = (user as any).customerId || (user as any).CustomerId;
      // Fetch details grouped by order to show progress
      const allDetails = await api.get('/OrderDetail');
      // Filter for this user and non-completed orders
      // Filter for this user
      const userOrders = allDetails.filter((d: any) => 
        (d.order?.session?.customerId === cid || d.order?.session?.CustomerId === cid)
      );

      
      // Group by OrderId
      const grouped = userOrders.reduce((acc: any, curr: any) => {
        const oid = curr.orderId || curr.OrderId;
        if (!oid) return acc;

        if (!acc[oid]) {
          acc[oid] = {
            orderId: oid,
            status: curr.order?.status || curr.order?.Status || 'Pending',
            items: [],
            orderTime: curr.order?.orderTime || curr.order?.OrderTime
          };
        }
        acc[oid].items.push(curr);
        return acc;
      }, {});
      
      setActiveOrders(Object.values(grouped));
    } catch (e) {
      console.error('Failed to fetch active orders:', e);
    }
  };

  // Save Cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('mì') || n.includes('ramen')) return '🍜';
    if (n.includes('cơm') || n.includes('rice')) return '🍚';
    if (n.includes('burger') || n.includes('bánh')) return '🍔';
    if (n.includes('nước') || n.includes('sting') || n.includes('drink')) return '🥤';
    if (n.includes('xúc xích') || n.includes('sausage')) return '🌭';
    if (n.includes('chuột') || n.includes('mouse')) return '🖱️';
    if (n.includes('tai nghe') || n.includes('headset') || n.includes('phone')) return '🎧';
    if (n.includes('phím') || n.includes('keyboard')) return '⌨️';
    return '🍱';
  };

  const subCategories = useMemo(() => {
    // No sub-categories for Combo, Packages, and Time categories
    if (activeCategory === 'Combo' || activeCategory === 'Packages' || activeCategory === 'Time') return [];

    const subs = services
      .filter(s => s.category === activeCategory && s.subCategory)
      .map(s => s.subCategory);
    return ['Tất cả', ...Array.from(new Set(subs))];
  }, [services, activeCategory]);

  useEffect(() => {
    setActiveSubCategory('Tất cả');
  }, [activeCategory]);

  const getCurrentPrice = (item: any) => {
    const areaName = session?.computer?.room?.type; // e.g. Vip, Standard, Stream
    if (areaName && item.areaPrices && item.areaPrices.length > 0) {
      const areaPrice = item.areaPrices.find((p: any) => p.areaName.toLowerCase() === areaName.toLowerCase());
      if (areaPrice) return areaPrice.price;
    }
    return item.price;
  };

  const calculatePlaytime = (price: number) => {
    const hourlyRate = session?.computer?.room?.pricePerHour || 8000;
    const totalMinutes = (price / hourlyRate) * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    
    if (h > 0 && m > 0) return `${h}h ${m}p`;
    if (h > 0) return `${h}h`;
    return `${m}p`;
  };

  const addToCart = (item: any) => {
    const price = getCurrentPrice(item);
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === item.serviceId);
      if (existing) {
        return prev.map(i => i.serviceId === item.serviceId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.serviceId === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.serviceId !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredItems = services.filter(item => {
    // Only show active items
    const isActive = item.isActive !== undefined ? item.isActive : item.IsActive;
    if (isActive === false) return false;

    const matchesCategory = item.category === activeCategory;
    if (activeCategory === 'Combo' || activeCategory === 'Packages' || activeCategory === 'Time') return matchesCategory;
    
    const matchesSubCategory = activeSubCategory === 'Tất cả' || item.subCategory === activeSubCategory;
    return matchesCategory && matchesSubCategory;
  });

  return (
    <div className="flex h-screen w-screen bg-[#030712] overflow-hidden relative">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 gap-8 animate-slide-right">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-black tracking-tighter text-gray-900">Cyber <span className="text-primary">Menu</span></h2>
        </div>

        {sidebarGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">{group.title}</h3>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={`relative flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    activeCategory === item.id 
                    ? 'bg-red-50 text-gray-900' 
                    : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-gray-100 ${item.color} group-hover:scale-110 transition-transform`}>
                       <item.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className={`font-bold text-sm ${activeCategory === item.id ? 'text-gray-900' : 'text-gray-600'}`}>{item.name}</span>
                  </div>
                  
                  {item.id === activeCategory && (
                    <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-red-500 rounded-l-full"></div>
                  )}

                  {item.badge && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-1 rounded-lg border border-emerald-100">
                      <Zap size={8} fill="currentColor" />
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-4">
           <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Your Session</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-lg font-black text-gray-900">
                {session ? Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)) + 'h ' + Math.floor(((new Date().getTime() - new Date(session.startTime).getTime()) / (1000 * 60)) % 60) + 'm' : '0h 0m'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-primary">
                {session?.computer?.room?.type || 'Standard'} Area
              </span>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
        <header className="flex justify-between items-center animate-slide-up">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${sidebarGroups.flatMap(g => g.items).find(i => i.id === activeCategory)?.color}`}>
                  {(() => {
                    const Icon = sidebarGroups.flatMap(g => g.items).find(i => i.id === activeCategory)?.icon || Utensils;
                    return <Icon size={20} strokeWidth={3} />;
                  })()}
               </div>
               <h1 className="text-3xl font-black tracking-tighter text-white">
                 {sidebarGroups.flatMap(g => g.items).find(i => i.id === activeCategory)?.name || 'Order'}
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl gap-3 w-[350px]">
              <Search size={20} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="bg-transparent border-none text-white outline-none w-full font-bold text-sm"
              />
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 group"
            >
              <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#030712] shadow-xl animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* SUB-CATEGORY BAR (Only show if needed) */}
        {activeCategory !== 'Combo' && activeCategory !== 'Packages' && activeCategory !== 'Time' && (
          <div className="flex items-center gap-4 animate-slide-up [animation-delay:100ms] border-b border-white/5 pb-2">
            <div className="flex items-center justify-center w-10 h-10 text-muted hover:text-white transition-colors cursor-pointer">
                <SlidersHorizontal size={20} />
            </div>
            
            <div className="flex-1 flex items-center gap-8 overflow-x-auto no-scrollbar">
                {subCategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubCategory(sub)}
                    className={`relative py-3 text-sm font-bold whitespace-nowrap transition-all ${
                      activeSubCategory === sub 
                      ? 'text-primary' 
                      : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {sub}
                    {activeSubCategory === sub && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
                    )}
                  </button>
                ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                <span>Sort by</span>
                <ChevronDown size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-4 animate-slide-up [animation-delay:200ms]">
          {activeCategory === 'History' ? (
            <div className="flex flex-col gap-6">
              <h2 className="text-3xl font-black text-white tracking-tight">Lịch sử đặt món</h2>
              <div className="flex flex-col gap-4">
                {activeOrders.length === 0 && (
                  <div className="p-12 glass rounded-[40px] text-center flex flex-col items-center gap-4">
                    <div className="text-6xl grayscale opacity-30">📜</div>
                    <div>
                      <p className="font-black text-white/50 uppercase tracking-widest">Chưa có lịch sử</p>
                      <p className="text-xs font-bold text-white/30">Hãy đặt món để nạp năng lượng ngay nhé!</p>
                    </div>
                  </div>
                )}
                
                {/* Lấy cả đơn active và đơn cũ (trong thực tế nên fetch riêng lịch sử) */}
                {/* Ở đây ta giả định activeOrders đã bao gồm các đơn đang xử lý */}
                {/* Ta sẽ fetch thêm các đơn đã hoàn thành/hủy */}
                <div className="grid grid-cols-1 gap-4">
                   {activeOrders.map((order: any) => (
                     <div key={order.orderId} className="p-6 rounded-[32px] glass border-white/5 flex flex-col md:flex-row justify-between gap-6 hover:bg-white/5 transition-all">
                        <div className="flex gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                            order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'
                          }`}>
                            <ShoppingBag size={28} />
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-white">Đơn hàng #{order.orderId}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                order.status === 'Completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                                order.status === 'Cancelled' ? 'border-rose-500/20 text-rose-500 bg-rose-500/5' : 'border-primary/20 text-primary bg-primary/5'
                              }`}>
                                {order.status === 'Pending' ? 'Đã nhận' : order.status === 'Preparing' ? 'Đang nấu' : order.status === 'Delivering' ? 'Đang giao' : order.status === 'Completed' ? 'Hoàn thành' : 'Đã hủy'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white/40 mt-1">
                              {new Date(order.orderTime).toLocaleString()} • {order.items.length} món
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end justify-center gap-2">
                           <span className="text-xl font-black text-white">
                             {order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()}đ
                           </span>
                           
                           {/* Nút hủy đơn - Phân loại theo loại hàng */}
                           {(() => {
                             // Kiểm tra nếu đơn hàng có món pha chế hoặc đồ ăn
                             const hasPreparedItems = order.items.some((item: any) => 
                               item.category === 'Food' || 
                               (item.category === 'Drinks' && !['Chai', 'Lon'].some(type => item.name.includes(type)))
                             );

                             const canCancel = hasPreparedItems 
                               ? order.status === 'Pending' // Đồ pha chế: Chỉ được hủy khi chưa làm
                               : ['Pending', 'Preparing', 'Delivering'].includes(order.status); // Đồ đóng chai: Hủy được tới tận lúc đang giao

                             return canCancel && (
                               <button 
                                 onClick={async (e) => {
                                   e.stopPropagation();
                                   if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
                                     try {
                                       const res = await fetch(`${API_BASE_URL}/Order/${order.orderId}`);
                                       const fullOrder = await res.json();
                                       
                                       // Kiểm tra lại logic một lần nữa trên server data
                                       const serverHasPrepared = fullOrder.orderDetails?.some((d: any) => 
                                         d.service?.category === 'Food' || 
                                         (d.service?.category === 'Drinks' && !['Chai', 'Lon'].some(type => d.service?.name.includes(type)))
                                       );

                                       const stillCanCancel = serverHasPrepared 
                                         ? fullOrder.status === 'Pending' 
                                         : ['Pending', 'Preparing', 'Delivering'].includes(fullOrder.status);

                                       if (!stillCanCancel) {
                                         alert('Không thể hủy đơn hàng này do trạng thái đã thay đổi hoặc có món pha chế đang được thực hiện!');
                                         fetchActiveOrders();
                                         return;
                                       }
                                       
                                       const updateRes = await fetch(`${API_BASE_URL}/Order/${order.orderId}`, {
                                         method: 'PUT',
                                         headers: { 'Content-Type': 'application/json' },
                                         body: JSON.stringify({ ...fullOrder, status: 'Cancelled' })
                                       });
                                       
                                       if (updateRes.ok) {
                                         alert('Đã hủy đơn hàng thành công!');
                                         fetchActiveOrders();
                                       }
                                     } catch (error) {
                                       console.error('Lỗi khi hủy đơn:', error);
                                     }
                                   }
                                 }}
                                 className="px-4 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                               >
                                 Hủy đơn hàng
                               </button>
                             );
                           })()}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center text-muted font-bold animate-pulse">
              Loading menu items...
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
              {filteredItems.map((item) => (
                <div key={item.serviceId} className="p-6 rounded-[32px] glass flex flex-col gap-4 group hover:bg-white/5 transition-all cursor-pointer">
                  <div className={`h-44 bg-white/5 rounded-[24px] flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden ${(item.stockQuantity === 0 && item.category !== 'Time' && item.category !== 'Combos' && item.category !== 'Packages') ? 'opacity-30' : ''}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE_URL}${item.imageUrl}`} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.category === 'Time' ? '⏱️' : getServiceIcon(item.name)}
                    {(item.stockQuantity === 0 && item.category !== 'Time' && item.category !== 'Combos' && item.category !== 'Packages') && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Hết hàng</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-primary">{item.category}</span>
                      <span className="text-muted">
                        {item.category === 'Time' 
                          ? `Mua được ~ ${calculatePlaytime(item.price)}` 
                          : (item.category === 'Combos' || item.category === 'Packages' || item.stockQuantity > 0) ? `Sẵn sàng` : 'Hết hàng'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white">{item.name}</h3>
                    <div className="flex justify-between items-center mt-3 pt-4 border-t border-white/5">
                      <span className="text-2xl font-black text-white">{getCurrentPrice(item).toLocaleString()}đ</span>
                      <button 
                        onClick={() => addToCart(item)}
                        disabled={item.stockQuantity === 0 && item.category !== 'Time' && item.category !== 'Combos' && item.category !== 'Packages'}
                        className={`w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all ${(item.stockQuantity === 0 && item.category !== 'Time' && item.category !== 'Combos' && item.category !== 'Packages') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted border-2 border-dashed border-white/5 rounded-[40px]">
               <div className="text-6xl grayscale opacity-50">🍱</div>
               <div className="text-center">
                  <p className="font-black uppercase tracking-widest text-lg">Empty Shelf</p>
                  <p className="text-xs font-bold opacity-50">No items found in {activeCategory} right now</p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* ORDER PROGRESS BAR (Floating at bottom) */}
      {activeOrders.some(o => o.status !== 'Completed' && o.status !== 'Cancelled') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[40] animate-slide-up">
          <div className="glass rounded-[32px] p-2 pr-6 border-primary/20 shadow-2xl flex items-center gap-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
               <Zap size={24} className="animate-pulse" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Tiến trình đơn hàng</span>
              <div className="flex items-center gap-4 mt-1">
                {activeOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').map((order: any) => (
                  <div key={order.orderId} className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        {order.items.length} món • {order.status === 'Pending' ? 'Đã nhận' : order.status === 'Preparing' ? 'Đang nấu' : 'Đang giao'}
                      </span>
                      {/* Progress Steps UI */}
                      <div className="flex gap-1 mt-1">
                        <div className={`h-1 w-8 rounded-full ${['Pending', 'Preparing', 'Delivering', 'Completed'].indexOf(order.status) >= 0 ? 'bg-primary' : 'bg-white/10'}`}></div>
                        <div className={`h-1 w-8 rounded-full ${['Preparing', 'Delivering', 'Completed'].indexOf(order.status) >= 0 ? 'bg-primary' : 'bg-white/10'}`}></div>
                        <div className={`h-1 w-8 rounded-full ${['Delivering', 'Completed'].indexOf(order.status) >= 0 ? 'bg-primary' : 'bg-white/10'}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={fetchActiveOrders}
              className="ml-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} className="rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* CART OVERLAY / DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="relative w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-left">
            <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                     <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight text-primary">Giỏ Hàng</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm đã chọn
                    </p>
                  </div>
               </div>
               <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X size={20} />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.serviceId} className="flex gap-4 p-4 rounded-3xl border border-gray-100 bg-white hover:border-primary/20 transition-all group">
                     <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {item.category === 'Time' ? '⏱️' : getServiceIcon(item.name)}
                     </div>
                     <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-black text-gray-900 leading-tight">{item.name}</h4>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                           </div>
                           <button 
                              onClick={() => removeFromCart(item.serviceId)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                           </button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <span className="font-black text-primary">{(item.price * item.quantity).toLocaleString()}đ</span>
                           <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
                              <button 
                                 onClick={() => updateQuantity(item.serviceId, -1)}
                                 className="w-8 h-8 bg-white text-gray-500 rounded-lg flex items-center justify-center hover:text-primary transition-colors shadow-sm"
                              >
                                 <Minus size={14} />
                              </button>
                              <span className="w-4 text-center font-black text-sm text-gray-900">{item.quantity}</span>
                              <button 
                                 onClick={() => updateQuantity(item.serviceId, 1)}
                                 className="w-8 h-8 bg-white text-gray-500 rounded-lg flex items-center justify-center hover:text-primary transition-colors shadow-sm"
                              >
                                 <Plus size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-gray-300">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl">🛒</div>
                   <div>
                      <p className="font-black text-gray-400 uppercase tracking-widest">Giỏ hàng trống</p>
                      <p className="text-xs font-bold text-gray-300">Hãy chọn vài món ngon để nạp năng lượng nhé!</p>
                   </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <footer className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phương thức thanh toán</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('Cash')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${paymentMethod === 'Cash' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      <Zap size={18} />
                      <span className="text-[11px] font-black">TIỀN MẶT</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('Transfer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${paymentMethod === 'Transfer' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      <CreditCard size={18} />
                      <span className="text-[11px] font-black">CHUYỂN KHOẢN</span>
                    </button>
                  </div>
                </div>

                <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ghi chú cho bếp</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Không hành, ít cay, nhiều đá..."
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 focus:border-primary outline-none transition-all resize-none h-24"
                  />
                </div>

                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Tổng thanh toán</p>
                      <h3 className="text-3xl font-black text-primary tracking-tighter">{cartTotal.toLocaleString()}đ</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center justify-end gap-1">
                        <Zap size={10} fill="currentColor" /> Fast Order
                      </p>
                      <p className="text-[10px] font-bold text-gray-400">Giao hàng tại máy</p>
                   </div>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(API_BASE_URL + '/Order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sessionId: session.sessionId,
                          orderTime: new Date().toISOString(),
                          status: 'Pending',
                          note: note
                        })
                      });
                      
                      const order = await res.json();
                      
                      for (const item of cart) {
                        await fetch(API_BASE_URL + '/OrderDetail', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderId: order.orderId,
                            serviceId: item.serviceId,
                            quantity: item.quantity,
                            price: item.price
                          })
                        });
                      }
                      
                      alert('Đặt món thành công! Vui lòng đợi trong giây lát.');
                      setCart([]);
                      setNote("");
                      setIsCartOpen(false);
                      fetchActiveOrders();
                    } catch (error) {
                      console.error("Order failed:", error);
                    }
                  }}
                  className="w-full py-5 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                   <span>ĐẶT MÓN NGAY</span>
                   <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </footer>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

