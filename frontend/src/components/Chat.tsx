import { useState, useEffect, useRef } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [token] = useState(localStorage.getItem('token') || '');
  const ws = useRef<any>(null);

  useEffect(() => {
    if (!token) return;

    const clientConfig: any = {
      headers: { Authorization: `Bearer ${token}` },
    };

    ws.current = new W3CWebSocket('ws://localhost:4000/api/chat', undefined, clientConfig);

    ws.current.onopen = () => console.log('WebSocket Connected');
    ws.current.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };
    ws.current.onerror = (error: any) => console.error('WebSocket Error:', error);
    ws.current.onclose = () => console.log('WebSocket Disconnected');

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [token]);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === 1 && message.trim()) {
      ws.current.send(message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Live Chat</h2>
      <div className="bg-white p-4 rounded-lg shadow-lg h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}</strong>: {msg.content} ({new Date(msg.createdAt).toLocaleTimeString()})
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;