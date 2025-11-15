import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import { AuthContext } from '../AuthContext';
import { useSocketContext } from '../SocketContext';
import InCallManager from 'react-native-incall-manager';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null); // { from: userId }
  const { userId } = useContext(AuthContext);
  const { socket } = useSocketContext();

  // Fetch unread message count
  const fetchMessageCount = async () => {
    if (!userId) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/get-matches/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const matches = response.data.matches || [];
      let unreadCount = 0;

      // Check each match for new messages
      await Promise.all(
        matches.map(async (match) => {
          try {
            const messagesResponse = await axios.get(`${BASE_URL}/messages`, {
              params: { senderId: userId, receiverId: match.userId },
            });

            const messages = messagesResponse.data || [];
            // Compute unread using lastSeen timestamp stored per conversation
            const key = `lastSeen:${userId}:${match.userId}`;
            const lastSeenIso = await AsyncStorage.getItem(key);
            const lastSeen = lastSeenIso ? new Date(lastSeenIso) : null;
            const countForMatch = messages.filter(m => {
              const isFromOther = m.senderId !== userId;
              const ts = new Date(m.timestamp);
              return isFromOther && (!lastSeen || ts > lastSeen);
            }).length;
            unreadCount += countForMatch;
          } catch (error) {
            console.log('Error fetching messages for match:', error);
          }
        })
      );

      setMessageCount(unreadCount);
    } catch (error) {
      console.log('Error fetching message count:', error);
    }
  };

  // Fetch unread likes count
  const fetchLikeCount = async () => {
    if (!userId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/received-likes/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const receivedLikes = response.data.receivedLikes || [];
      setLikeCount(receivedLikes.length);
    } catch (error) {
      console.log('Error fetching like count:', error);
    }
  };

  // Refresh all counts
  const refreshCounts = () => {
    fetchMessageCount();
    fetchLikeCount();
  };

  // Clear message count (when user opens chat)
  const clearMessageCount = () => {
    setMessageCount(0);
  };

  // Clear like count (when user opens likes screen)
  const clearLikeCount = () => {
    setLikeCount(0);
  };

  // Auto-refresh counts periodically
  useEffect(() => {
    if (userId) {
      refreshCounts();
      
      // Refresh every 30 seconds
      const interval = setInterval(refreshCounts, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Global incoming call listener
  useEffect(() => {
    if (!socket) return;
    const onIncoming = (payload) => {
      const from = payload?.from;
      if (!from) return;
      setIncomingCall({ from });
      // Play ringtone to make incoming call obvious
      try { InCallManager.startRingtone('default'); } catch (e) {}
    };
    const onEnd = () => {
      setIncomingCall(null);
      try { InCallManager.stopRingtone(); } catch (e) {}
    };
    socket.on('call:incoming', onIncoming);
    socket.on('call:end', onEnd);
    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:end', onEnd);
    };
  }, [socket]);

  // Stop ringtone if banner is dismissed
  useEffect(() => {
    if (!incomingCall) {
      try { InCallManager.stopRingtone(); } catch (e) {}
    }
  }, [incomingCall]);

  const value = {
    messageCount,
    likeCount,
    refreshCounts,
    clearMessageCount,
    clearLikeCount,
    incomingCall,
    setIncomingCall,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;