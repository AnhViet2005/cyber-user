'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { X, Send, User, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id?: number;
  sender: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  username: string;
}

export default function SupportChat({ isOpen, onClose, customerId, username }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch history
    api.get(`/Support/customer/${customerId}`)
      .then(data => setMessages(data))
      .catch(err => console.error('Failed to fetch chat history:', err));

    // Mark as read
    api.put(`/Support/mark-read/${customerId}?reader=User`)
      .catch(err => console.error('Failed to mark messages as read:', err));

    // Initialize SignalR
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://cyber-api-final.onrender.com/chatHub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [isOpen, customerId]);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR Hub');
          connection.invoke('JoinUserGroup', customerId.toString());

          connection.on('ReceiveMessage', (sender, message) => {
            setMessages(prev => [...prev, {
              sender,
              message,
              timestamp: new Date().toISOString(),
              isRead: true
            }]);
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      return () => {
        connection.stop();
      };
    }
  }, [connection, customerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !connection) return;

    try {
      // 1. Save to DB via API
      const msgData = {
        customerId,
        sender: 'User',
        message: inputValue,
        isRead: false
      };
      await api.post('/Support', msgData);

      // 2. Send via SignalR
      await connection.invoke('SendMessageToAdmin', customerId.toString(), inputValue);
      
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg h-[600px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Hỗ trợ trực tuyến</h3>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Đang kết nối với Admin</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted gap-2 opacity-50">
               <MessageSquare size={48} strokeWidth={1} />
               <p className="text-sm font-bold">Chưa có tin nhắn nào. Hãy gửi tin nhắn để được hỗ trợ!</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                  msg.sender === 'User' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                }`}
              >
                {msg.message}
              </div>
              <span className="text-[9px] font-bold text-muted uppercase mt-1 tracking-widest">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập nội dung cần hỗ trợ..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
