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
          credentials: 'include', // If needed for cookies/auth
        });
        if (response.ok) {
          const history = await response.json();
          const sortedHistory = history.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sortedHistory);
          localStorage.setItem('chatMessages', JSON.stringify(sortedHistory));
          console.log('Loaded chat history:', sortedHistory);
        } else {
          console.error('Failed to load chat history, status:', response.status);
          setConnectionError(`Failed to load chat history (status: ${response.status}).`);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setConnectionError('Failed to load chat history. Check server connection.');
      }
    };

    if (userId && userId > 0) {
      loadInitialData();
    }
  }, [userId, token]);

  useEffect(() => {
    console.log('Stored userId from localStorage:', storedUserId);
    console.log('Parsed userId:', userId);
    if (!userId || userId <= 0) {
      console.error('Invalid userId, WebSocket connection will not be initiated.');
      setConnectionError('Invalid userId. Please log in again.');
      return;
    }

    const connectWebSocket = () => {
      setConnectionAttempts((prev) => prev + 1);
      console.log(`Connection attempt #${connectionAttempts + 1}`);

      const wsUrl = `ws://localhost:4000/api/chat?userId=${userId}`;
      console.log('Attempting to connect to WebSocket at:', wsUrl);

      try {
        ws.current = new W3CWebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket Connected to:', wsUrl);
          setIsConnected(true);
          setConnectionError(null);
          setConnectionAttempts(0);
        };

        ws.current.onmessage = (event: any) => {
          const data = JSON.parse(event.data);
          console.log('Received message data:', data);
          if (data.error) {
            console.error('Message error:', data.error);
            if (data.error === 'Sender not found') {
              setConnectionError('User not found. Please log in again.');
              localStorage.removeItem('id');
              localStorage.removeItem('token');
            }
            return;
          }
          if (data.receiverId === userId || (data.sent && data.senderId === userId)) {
            setMessages((prev) => {
              const updatedMessages = [...prev, data].sort((a: any, b: any) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
              console.log('Updated messages saved to localStorage:', updatedMessages);
              return updatedMessages;
            });
            if (data.senderId && !chatUsers.find(u => u.id === data.senderId) && data.senderId !== userId) {
              setChatUsers((prev) => {
                const updatedUsers = [...prev, { id: data.senderId, username: data.username }];
                localStorage.setItem('chatUsers', JSON.stringify(updatedUsers));
                console.log('Updated chatUsers saved to localStorage:', updatedUsers);
                return updatedUsers;
              });
            }
          }
        };

        ws.current.onerror = (error: any) => {
          console.error('WebSocket Error:', error);
          setIsConnected(false);
          setConnectionError(`Failed to connect to chat service (attempt ${connectionAttempts + 1}). Check if chat-service is running on port 4000.`);
        };

        ws.current.onclose = (event: any) => {
          console.log('WebSocket Disconnected, code:', event.code, 'reason:', event.reason);
          setIsConnected(false);
          setConnectionError(`WebSocket disconnected (code ${event.code}). Reconnecting...`);
          const delay = Math.min(2000 * Math.pow(2, connectionAttempts), 10000);
          setTimeout(connectWebSocket, delay);
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        setConnectionError('Error initializing WebSocket connection.');
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        console.log('Cleaning up WebSocket');
        ws.current.close();
      }
    };
  }, [userId]);

  useEffect(() => {
    console.log('Messages updated, saving to localStorage:', messages);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    console.log('ChatUsers updated, saving to localStorage:', chatUsers);
    localStorage.setItem('chatUsers', JSON.stringify(chatUsers));
  }, [chatUsers]);

  const selectChat = (user: any) => {
    console.log('Selecting chat for user:', user);
    setSelectedUser(user);
    const filteredMessages = messages.filter(msg => 
      (msg.senderId === user.id && msg.receiverId === userId) || 
      (msg.receiverId === user.id && msg.senderId === userId)
    );
    const sortedFilteredMessages = filteredMessages.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    console.log('Filtered messages for selected user:', sortedFilteredMessages);
    setMessages(sortedFilteredMessages);
    localStorage.setItem('chatMessages', JSON.stringify(sortedFilteredMessages));
  };

  const sendMessage = () => {
    console.log(`ws.current = ${ws.current}`);
    console.log(`ws.current.readyState = ${ws.current?.readyState}`);
    console.log(`message.trim = ${message.trim()}`);
    console.log(`selectedUser = ${selectedUser}`);

    if (ws.current && ws.current.readyState === 1 && message.trim() && selectedUser) {
      const msg = { 
        to: selectedUser.id, 
        content: message, 
        senderId: userId, 
        username: 'You', 
        createdAt: new Date().toISOString(),
        receiverId: selectedUser.id 
      };
      ws.current.send(JSON.stringify(msg));
      setMessages((prev) => {
        const updatedMessages = [...prev, msg].sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
        console.log('Sent message added locally:', updatedMessages);
        return updatedMessages;
      });
      setMessage('');
    } else {
      console.log('Cannot send message: WebSocket not ready or invalid state');
    }
  };

  const addNewChat = async () => {
    if (searchUsername && token) {
      try {
        const newUser = await getUserByUsername(token, searchUsername);
        if (newUser && newUser.id !== userId && !chatUsers.find(u => u.id === newUser.id)) {
          setChatUsers((prev) => {
            const updatedUsers = [...prev, newUser];
            localStorage.setItem('chatUsers', JSON.stringify(updatedUsers));
            console.log('Added new chat user:', updatedUsers);
            return updatedUsers;
          });
          setSelectedUser(newUser);
          const filteredMessages = messages.filter(msg => 
            (msg.senderId === newUser.id && msg.receiverId === userId) || 
            (msg.receiverId === newUser.id && msg.senderId === userId)
          );
          const sortedFilteredMessages = filteredMessages.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sortedFilteredMessages);
          localStorage.setItem('chatMessages', JSON.stringify(sortedFilteredMessages));
        } else if (newUser && newUser.id === userId) {
          console.warn("Cannot add yourself to chat list.");
        } else if (newUser && chatUsers.find(u => u.id === newUser.id)) {
          console.warn("User already in chat list.");
        }
      } catch (error) {
        console.error('Error adding new chat:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Chat</h2>
      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {connectionError}
        </div>
      )}
      <div className="mb-4 flex">
        <input
          type="text"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder="Search username to chat..."
          className="p-1 border rounded-l text-black"
        />
        <button onClick={addNewChat} className="bg-blue-500 text-white p-1 rounded-r">
          Add Chat
        </button>
      </div>
      <div className="flex">
        <div className="w-1/4 bg-white p-4 rounded-lg shadow-lg mr-4 h-64 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Chats</h3>
          {chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => selectChat(user)}
              className="cursor-pointer p-2 hover:bg-gray-200 rounded"
            >
              {user.username}
            </div>
          ))}
        </div>
        <div className="w-3/4">
          <div className="bg-white p-4 rounded-lg shadow-lg h-64 overflow-y-auto mb-4">
            {selectedUser ? (
              messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong>{msg.username || 'Unknown'}</strong>: {msg.content || 'No content'} ({msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'No time'})
                </div>
              ))
            ) : (
              <p>Select a chat to start messaging</p>
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              disabled={!selectedUser || !isConnected}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
              disabled={!selectedUser || !isConnected}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;