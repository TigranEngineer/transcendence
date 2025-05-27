import { useState, useEffect, useRef } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { getUserByUsername } from '../services/api';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [chatUsers, setChatUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('chatUsers');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const storedUserId = localStorage.getItem('id') || '0';
  const [userId] = useState(parseInt(storedUserId));
  const [searchUsername, setSearchUsername] = useState('');
  const ws = useRef<any>(null);
  const token = localStorage.getItem('token');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/chat/history?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (response.ok) {
          const history = await response.json();
          const sortedHistory = history.sort((a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sortedHistory);
          localStorage.setItem('chatMessages', JSON.stringify(sortedHistory));
        } else {
          setConnectionError(`Failed to load chat history (status: ${response.status}).`);
        }
      } catch (error) {
        setConnectionError('Failed to load chat history. Check server connection.');
      }
    };

    if (userId > 0) loadInitialData();
  }, [userId, token]);

  useEffect(() => {
    if (userId <= 0) {
      setConnectionError('Invalid userId. Please log in again.');
      return;
    }

    const connectWebSocket = () => {
      setConnectionAttempts((prev) => prev + 1);
      const wsUrl = `ws://localhost:4000/api/chat?userId=${userId}`;

      try {
        ws.current = new W3CWebSocket(wsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          setConnectionError(null);
          setConnectionAttempts(0);
        };

        ws.current.onmessage = (event: any) => {
          const data = JSON.parse(event.data);
          if (data.error) {
            if (data.error === 'Sender not found') {
              setConnectionError('User not found. Please log in again.');
              localStorage.removeItem('id');
              localStorage.removeItem('token');
            }
            return;
          }
          if (data.receiverId === userId || (data.sent && data.senderId === userId)) {
            setMessages((prev) => {
              const updated = [...prev, data].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              localStorage.setItem('chatMessages', JSON.stringify(updated));
              return updated;
            });
            if (data.senderId && !chatUsers.find(u => u.id === data.senderId) && data.senderId !== userId) {
              setChatUsers((prev) => {
                const updated = [...prev, { id: data.senderId, username: data.username }];
                localStorage.setItem('chatUsers', JSON.stringify(updated));
                return updated;
              });
            }
          }
        };

        ws.current.onerror = () => {
          setIsConnected(false);
          setConnectionError(`WebSocket error (attempt ${connectionAttempts + 1}). Check chat-service.`);
        };

        ws.current.onclose = (event: any) => {
          setIsConnected(false);
          setConnectionError(`WebSocket disconnected (code ${event.code}). Reconnecting...`);
          const delay = Math.min(2000 * Math.pow(2, connectionAttempts), 10000);
          setTimeout(connectWebSocket, delay);
        };
      } catch {
        setConnectionError('Error initializing WebSocket connection.');
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [userId, connectionAttempts]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatUsers', JSON.stringify(chatUsers));
  }, [chatUsers]);

  const selectChat = (user: any) => {
    setSelectedUser(user);
    const filtered = messages.filter(msg =>
      (msg.senderId === user.id && msg.receiverId === userId) ||
      (msg.receiverId === user.id && msg.senderId === userId)
    );
    const sorted = filtered.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setMessages(sorted);
    localStorage.setItem('chatMessages', JSON.stringify(sorted));
  };

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === 1 && message.trim() && selectedUser) {
      const msg = {
        content: message.trim(),
        senderId: userId,
        username: 'You',
        createdAt: new Date().toISOString(),
        receiverId: selectedUser.id,
      };

      try {
        ws.current.send(JSON.stringify(msg));
        setMessages((prev) => {
          const updated = [...prev, msg].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          localStorage.setItem('chatMessages', JSON.stringify(updated));
          return updated;
        });
        setMessage('');
      } catch {
        console.error('Failed to send message via WebSocket');
      }
    }
  };

  const addNewChat = async () => {
    if (searchUsername && token) {
      try {
        const newUser = await getUserByUsername(token, searchUsername);
        if (newUser && newUser.id !== userId && !chatUsers.find(u => u.id === newUser.id)) {
          setChatUsers((prev) => {
            const updated = [...prev, newUser];
            localStorage.setItem('chatUsers', JSON.stringify(updated));
            return updated;
          });
          setSelectedUser(newUser);
          const filtered = messages.filter(msg =>
            (msg.senderId === newUser.id && msg.receiverId === userId) ||
            (msg.receiverId === newUser.id && msg.senderId === userId)
          );
          const sorted = filtered.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sorted);
          localStorage.setItem('chatMessages', JSON.stringify(sorted));
        }
      } catch {
        console.error('Error adding new chat');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 border-b-2 border-blue-300 pb-2">
        Chat
      </h2>

      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-6 py-3 rounded-md mb-6 shadow-sm">
          {connectionError}
        </div>
      )}

      <div className="mb-6 flex max-w-md">
        <input
          type="text"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder="Search username to chat..."
          className="flex-grow p-3 border border-gray-300 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button
          onClick={addNewChat}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 rounded-r-md font-semibold"
        >
          Add Chat
        </button>
      </div>

      <div className="flex flex-grow gap-6">
        <aside className="w-1/4 bg-white rounded-xl shadow-lg p-5 h-[26rem] overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
            Chats
          </h3>
          {chatUsers.length === 0 && (
            <p className="text-gray-400 italic text-sm">No chats yet</p>
          )}
          {chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => selectChat(user)}
              className={`cursor-pointer p-3 rounded-lg mb-2 transition hover:bg-blue-100 ${
                selectedUser?.id === user.id ? 'bg-blue-200 font-semibold text-blue-700' : 'text-gray-800'
              }`}
            >
              {user.username}
            </div>
          ))}
        </aside>

        <section className="flex-1 flex flex-col">
          <div className="bg-white rounded-xl shadow-lg p-6 h-[26rem] overflow-y-auto mb-5 flex flex-col-reverse">
            {selectedUser ? (
              messages.length > 0 ? (
                messages
                  .slice()
                  .reverse()
                  .map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-3 px-4 py-2 rounded-lg max-w-xs ${
                        msg.username === selectedUser.username
                          ? 'bg-blue-100 self-start text-blue-900'
                          : 'bg-gray-200 self-end text-gray-800'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">{msg.username || 'Unknown'}</div>
                      <div>{msg.content || 'No content'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'No time'}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-400 italic">No messages yet. Start the conversation!</p>
              )
            ) : (
              <p className="text-gray-500 italic self-center mt-auto">Select a chat to start messaging</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-0"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder={selectedUser && isConnected ? 'Type a message...' : 'Select a chat to send messages'}
              disabled={!selectedUser || !isConnected}
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 rounded-r-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedUser || !isConnected}
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Chat;
