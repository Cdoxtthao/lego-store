import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import axiosClient from '../../api/axiosClient';
import { getImageUrl } from '../../utils/imageHelper';

const AdminChat = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    setupSignalR();
    return () => { connectionRef.current?.stop(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSignalR = async () => {
    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7175/hubs/chat', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    // Nhận tin nhắn mới từ user
    connection.on('ReceiveUserMessage', (msg: any) => {
      // Cập nhật conversations
      fetchConversations();

      // Nếu đang xem chat của user này
      if (selectedUser?.userId === msg.userId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    await connection.start();
    setConnected(true);
    connectionRef.current = connection;
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Messages/conversations');
      setConversations(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (conv: any) => {
    setSelectedUser(conv);
    try {
      const res = await axiosClient.get(`/Messages/user/${conv.userId}`);
      setMessages(res.data);
      // Cập nhật unread = 0
      setConversations(prev =>
        prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c)
      );
    } catch {
      setMessages([]);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedUser) return;
    try {
      await connectionRef.current?.invoke('ReplyMessage', selectedUser.userId, reply);
      setMessages(prev => [...prev, {
        content: reply,
        isFromUser: false,
        createdAt: new Date().toISOString(),
      }]);
      setReply('');
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">💬 Tin nhắn khách hàng</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <p className="text-sm text-gray-400">
              {connected ? 'Đang kết nối realtime' : 'Chưa kết nối'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: 'calc(100vh - 200px)' }}>

        {/* Danh sách conversations */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">
              Cuộc trò chuyện ({conversations.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <span className="text-4xl mb-2">💬</span>
                <p className="text-sm text-center">Chưa có tin nhắn nào</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectUser(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 text-left
                    ${selectedUser?.userId === conv.userId ? 'bg-flower-50' : ''}`}>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-flower-100 flex items-center justify-center flex-shrink-0">
                    {conv.avatarUrl ? (
                      <img
                        src={conv.avatarUrl.startsWith('http')
                          ? conv.avatarUrl
                          : `https://localhost:7175${conv.avatarUrl}`}
                        alt={conv.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {conv.userName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {conv.userName}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(conv.lastTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {!conv.isFromUser && '👤 Bạn: '}{conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-flower-100 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-5xl mb-3">💬</span>
              <p className="font-medium text-gray-600">Chọn cuộc trò chuyện</p>
              <p className="text-sm mt-1">để xem và trả lời tin nhắn</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-flower-100 flex items-center justify-center">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl.startsWith('http')
                        ? selectedUser.avatarUrl
                        : `https://localhost:7175${selectedUser.avatarUrl}`}
                      alt={selectedUser.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {selectedUser.userName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedUser.userName}</p>
                  <p className="text-xs text-gray-400">{selectedUser.userEmail}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.isFromUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                      ${msg.isFromUser
                        ? 'bg-white text-gray-700 shadow-sm rounded-bl-sm'
                        : 'bg-flower-100 text-white rounded-br-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isFromUser ? 'text-gray-400' : 'text-white/70'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  placeholder={`Trả lời ${selectedUser.userName}...`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                />
                <button
                  onClick={handleReply}
                  disabled={!reply.trim()}
                  className="px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-40 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;