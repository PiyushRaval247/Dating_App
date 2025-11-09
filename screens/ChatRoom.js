import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Image,
  Modal,
  PermissionsAndroid,
  Alert,
  ToastAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import React, {useState, useContext, useEffect, useLayoutEffect, useRef} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import {useSocketContext} from '../SocketContext';
import { useNotification } from '../context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatRoom = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [message, setMessage] = useState('');
  const {userId} = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [savedOpeners, setSavedOpeners] = useState([]);
  const [savingOpener, setSavingOpener] = useState(false);
  const {socket} = useSocketContext();
  const { clearMessageCount } = useNotification();
  const [isTyping, setIsTyping] = useState(false);
  const stopTypingTimerRef = useRef(null);
  const [presence, setPresence] = useState({ online: false, lastSeen: null });
  const presenceIntervalRef = useRef(null);
  const [fullImageUrl, setFullImageUrl] = useState(null);
  const [showImageField, setShowImageField] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [localReactions, setLocalReactions] = useState({}); // { [messageId]: [emoji,...] }
  const [showActions, setShowActions] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByPeer, setBlockedByPeer] = useState(false);

  const showToast = (msg) => {
    if (!msg) return;
    if (Platform.OS === 'android') {
      ToastAndroid.show(String(msg), ToastAndroid.SHORT);
    } else {
      Alert.alert('', String(msg));
    }
  };

  // Dedupe messages by messageId (fallback to composite key) and keep chronological order
  const dedupeMessages = (list = []) => {
    try {
      const map = new Map();
      list.forEach(m => {
        const key = m?.messageId || `${m?.senderId}-${m?.receiverId}-${m?.timestamp}-${m?.message}`;
        if (!map.has(key)) map.set(key, m);
      });
      return Array.from(map.values()).sort((a, b) => {
        const at = new Date(a?.timestamp || 0).getTime();
        const bt = new Date(b?.timestamp || 0).getTime();
        return at - bt;
      });
    } catch (e) {
      return Array.isArray(list) ? list : [];
    }
  };

  const formatTime = iso => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12; // convert 0-23 to 1-12
      return `${h}:${m} ${suffix}`;
    } catch (e) {
      return '';
    }
  };
  const handleVideoPress = React.useCallback(() => {
    if (isBlocked || blockedByPeer) return;
    const peerId = route?.params?.receiverId;
    if (!peerId) return;
    navigation.navigate('VideoCall', {
      peerId,
      name: route?.params?.name,
      isCaller: true,
    });
  }, [isBlocked, blockedByPeer, route?.params?.receiverId, route?.params?.name, navigation]);

  const handleMenuPress = React.useCallback(() => {
    setShowActions(true);
  }, []);

  useLayoutEffect(() => {
    return navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{flexDirection: 'row', alignItems: 'center', gap: 10}}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="arrow-back" size={24} color="black" />
          <View>
            <Text style={{fontSize: 16, fontWeight: 'bold'}}>
              {route?.params?.name}
            </Text>
            <Text style={{fontSize: 12, color: presence?.online ? '#2e8b57' : '#666'}}>
              {presence?.online ? 'Online' : (presence?.lastSeen ? `Last seen ${formatTime(presence.lastSeen)}` : '')}
            </Text>
          </View>
        </Pressable>
      ),
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, pointerEvents: 'box-none'}}>
          <TouchableOpacity
            onPress={handleVideoPress}
            disabled={isBlocked || blockedByPeer}
            activeOpacity={0.6}
            style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Ionicons name="videocam-outline" size={26} color={(isBlocked || blockedByPeer) ? '#aaa' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMenuPress}
            activeOpacity={0.6}
            style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [presence?.online, presence?.lastSeen, route?.params?.name, route?.params?.receiverId, isBlocked, blockedByPeer, handleVideoPress, handleMenuPress]);
  const sendMessage = async (senderId, receiverId) => {
    try {
      if (isBlocked || blockedByPeer) return;
      setMessage('');

      await axios.post(`${BASE_URL}/sendMessage`, {
        senderId,
        receiverId,
        message,
      });

      socket.emit('sendMessage', {senderId, receiverId, message});

      setTimeout(() => {
        fetchMessages();
      }, 100);

      // Notify stop typing after sending
      socket?.emit('stopTyping', { senderId, receiverId });
    } catch (error) {
      if (error?.response?.status === 403) {
        setIsBlocked(true);
      }
      console.log('Error', error?.response?.data || error?.message || error);
    }
  };
  useEffect(() => {
    fetchMessages();
    // Clear message badge when entering the chat room
    clearMessageCount && clearMessageCount();
  }, []);
  // Presence polling for receiver
  useEffect(() => {
    const receiverId = route?.params?.receiverId;
    const pollPresence = async () => {
      if (!receiverId) return;
      try {
        const resp = await axios.get(`${BASE_URL}/presence`, { params: { userId: receiverId } });
        const { online, lastSeen } = resp?.data || {};
        setPresence({ online: !!online, lastSeen: lastSeen || null });
      } catch (e) {
        // silent
      }
    };
    pollPresence();
    presenceIntervalRef.current = setInterval(pollPresence, 5000);
    return () => {
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    };
  }, [route?.params?.receiverId]);
  useEffect(() => {
    const fetchOpeners = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const resp = await axios.get(`${BASE_URL}/openers`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedOpeners(resp?.data?.savedOpeners || []);
      } catch (e) {
        console.log('Error fetching openers', e?.response?.data || e?.message);
      }
    };
    if (userId) fetchOpeners();
  }, [userId]);
  const fetchMessages = async () => {
    try {
      const senderId = userId;
      const receiverId = route?.params?.receiverId;

      const response = await axios.get(`${BASE_URL}/messages`, {
        params: {senderId, receiverId},
      });

      setMessages(prev => dedupeMessages([...(Array.isArray(response?.data) ? response.data : []), ...(Array.isArray(prev) ? prev : [])]));

      // Mark conversation as seen with latest timestamp
      const last = response.data?.[response.data.length - 1]?.timestamp;
      const seenTime = last || new Date().toISOString();
      const key = `lastSeen:${senderId}:${receiverId}`;
      await AsyncStorage.setItem(key, seenTime);
    } catch (error) {
      if (error?.response?.status === 403) {
        setBlockedByPeer(true);
      }
      console.log('Error', error?.response?.data || error?.message || error);
    }
  };

  // Automatically mark messages as read when they appear in the chat
  useEffect(() => {
    const receiverId = route?.params?.receiverId;
    if (!receiverId || !Array.isArray(messages) || messages.length === 0) return;
    const unreadIds = messages
      .filter(m => m?.senderId === receiverId && !m?.readAt)
      .map(m => m?.messageId)
      .filter(Boolean);
    if (!unreadIds.length) return;
    axios.post(`${BASE_URL}/messages/mark-read`, {
      senderId: receiverId,
      receiverId: userId,
      messageIds: unreadIds,
    }).catch(() => {});
  }, [messages, route?.params?.receiverId, userId]);

  const listenMessages = () => {
    const {socket} = useSocketContext();

    useEffect(() => {
      socket?.on('newMessage', newMessage => {
        if (isBlocked || blockedByPeer) return;
        newMessage.shouldShake = true;
        setMessages(prev => dedupeMessages([...(Array.isArray(prev) ? prev : []), newMessage]));
        // Update seen time while inside the chat
        const key = `lastSeen:${userId}:${route?.params?.receiverId}`;
        AsyncStorage.setItem(key, new Date().toISOString());
      });

      // Delivered/read events
      const onDelivered = (payload) => {
        const { messageId, deliveredAt } = payload || {};
        if (!messageId) return;
        setMessages(prev => prev.map(m => m?.messageId === messageId ? { ...m, deliveredAt: deliveredAt || new Date().toISOString() } : m));
      };
      const onRead = (payload) => {
        const ids = payload?.messageIds || [];
        const readAt = payload?.readAt || new Date().toISOString();
        if (!ids.length) return;
        setMessages(prev => prev.map(m => ids.includes(m?.messageId) ? { ...m, readAt } : m));
      };
      socket?.on('messages:delivered', onDelivered);
      socket?.on('message:delivered', onDelivered);
      socket?.on('messages:read', onRead);

      // Reaction updates
      const onReaction = (payload) => {
        if (isBlocked || blockedByPeer) return;
        const { messageId, reaction } = payload || {};
        if (!messageId || !reaction) return;
        setLocalReactions(prev => {
          const list = prev[messageId] || [];
          return { ...prev, [messageId]: [...list, reaction] };
        });
      };
      socket?.on('messages:reaction', onReaction);

      // Typing indicator from other user
      const onTyping = (payload) => {
        if (!isBlocked && !blockedByPeer && payload?.senderId === route?.params?.receiverId) {
          setIsTyping(true);
        }
      };
      const onStopTyping = (payload) => {
        if (!isBlocked && !blockedByPeer && payload?.senderId === route?.params?.receiverId) {
          setIsTyping(false);
        }
      };
      socket?.on('typing', onTyping);
      socket?.on('stopTyping', onStopTyping);

      const onUserBlock = (payload) => {
        const actorId = payload?.actorId ?? payload?.blockerId;
        const targetId = payload?.targetId ?? payload?.blockedId;
        if (!actorId || !targetId) return;
        if (actorId === userId && targetId === route?.params?.receiverId) {
          setIsBlocked(true);
        } else if (actorId === route?.params?.receiverId && targetId === userId) {
          setBlockedByPeer(true);
        }
      };
      const onUserUnblock = (payload) => {
        const actorId = payload?.actorId ?? payload?.unblockerId;
        const targetId = payload?.targetId ?? payload?.unblockedId;
        if (!actorId || !targetId) return;
        if (actorId === userId && targetId === route?.params?.receiverId) {
          setIsBlocked(false);
        } else if (actorId === route?.params?.receiverId && targetId === userId) {
          setBlockedByPeer(false);
        }
      };
      socket?.on('user:block', onUserBlock);
      socket?.on('user:unblock', onUserUnblock);

      return () => {
        socket?.off('typing', onTyping);
        socket?.off('stopTyping', onStopTyping);
        socket?.off('messages:delivered', onDelivered);
        socket?.off('message:delivered', onDelivered);
        socket?.off('messages:read', onRead);
        socket?.off('messages:reaction', onReaction);
        socket?.off('user:block', onUserBlock);
        socket?.off('user:unblock', onUserUnblock);
      };
    }, [socket, messages, setMessages, isBlocked, blockedByPeer, userId, route?.params?.receiverId]);
  };

  listenMessages();
  const [incomingCallFrom, setIncomingCallFrom] = useState(null);

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const mediaPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
      const legacyPerm = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const permToUse = mediaPerm || legacyPerm;
      const granted = await PermissionsAndroid.request(permToUse);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  };

  const pickImageFromGallery = async () => {
    const ok = await requestGalleryPermission();
    if (!ok) return;
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8 });
      const asset = res?.assets?.[0];
      if (!asset?.base64) return;
      setIsUploadingImage(true);
      const receiverId = route?.params?.receiverId;
      const uploadResp = await axios.post(`${BASE_URL}/upload-image`, {
        base64: asset.base64,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        contentType: asset.type || 'image/jpeg',
      });
      const imageUrl = uploadResp?.data?.url;
      if (!imageUrl) return;
      const payload = { senderId: userId, receiverId, message: '', type: 'image', imageUrl };
      await axios.post(`${BASE_URL}/sendMessage`, payload);
      socket?.emit('sendMessage', payload);
      setTimeout(() => { fetchMessages(); }, 120);
    } catch (e) {
      console.log('Gallery image send error', e?.response?.data || e?.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Listen for incoming call invites
  useEffect(() => {
    const onIncoming = ({from}) => {
      // Only prompt if this is the current chat partner
      if (from === route?.params?.receiverId) {
        setIncomingCallFrom(from);
      }
    };
    socket?.on('call:incoming', onIncoming);
    return () => socket?.off('call:incoming', onIncoming);
  }, [socket, route?.params?.receiverId]);

  const acceptCall = () => {
    if (!incomingCallFrom) return;
    socket?.emit('call:accept', {from: userId, to: incomingCallFrom});
    const name = route?.params?.name;
    setIncomingCallFrom(null);
    navigation.navigate('VideoCall', {peerId: incomingCallFrom, name, isCaller: false});
  };

  const rejectCall = () => {
    if (!incomingCallFrom) return;
    socket?.emit('call:reject', {from: userId, to: incomingCallFrom});
    setIncomingCallFrom(null);
  };
  const keyboardVerticalOffset = Platform.OS == 'ios' ? 65 : 0;
  console.log('Messages', messages);
  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={keyboardVerticalOffset}
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
      style={{flex: 1, backgroundColor: 'white'}}>
      {/* Full-screen image viewer */}
      <Modal visible={!!fullImageUrl} transparent animationType="fade" onRequestClose={() => setFullImageUrl(null)}>
        <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setFullImageUrl(null)}>
          {fullImageUrl ? (
            <Image source={{ uri: fullImageUrl }} style={{ width: '90%', height: '70%', resizeMode: 'contain' }} />
          ) : null}
        </Pressable>
      </Modal>

      {/* Report & Block actions */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setShowActions(false)}>
          <View style={{ width: '86%', backgroundColor: 'white', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Conversation Options</Text>
            <Pressable
              onPress={async () => {
                try {
                  const receiverId = route?.params?.receiverId;
                  if (!receiverId) return;
                  await axios.post(`${BASE_URL}/block`, { userId: userId, blockedUserId: receiverId });
                  setIsBlocked(true);
                  setShowActions(false);
                  showToast('User blocked');
                  // Hide the chat immediately
                  navigation.goBack();
                } catch (e) {
                  setShowActions(false);
                  console.log('Block error', e?.response?.data || e?.message);
                }
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ color: '#b00020', fontSize: 15 }}>Block User</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#eee' }} />
            <Pressable
              onPress={async () => {
                try {
                  const receiverId = route?.params?.receiverId;
                  if (!receiverId) return;
                  await axios.post(`${BASE_URL}/report`, { reporterId: userId, reportedUserId: receiverId, reason: 'inappropriate' });
                  showToast('Report submitted');
                } catch (e) {
                  console.log('Report error', e?.response?.data || e?.message);
                } finally {
                  setShowActions(false);
                }
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ color: '#662d91', fontSize: 15 }}>Report User</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#eee' }} />
            <Pressable onPress={() => setShowActions(false)} style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#333', fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {(isBlocked || blockedByPeer) && (
          <View style={{ padding: 10, margin: 10, borderRadius: 8, backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffeeba' }}>
            <Text style={{ color: '#856404', fontSize: 13 }}>
              {isBlocked ? 'You blocked this user. You will not receive or send messages.' : 'This user has blocked you. You cannot send messages.'}
            </Text>
          </View>
        )}
        {incomingCallFrom && (
          <View style={{position: 'absolute', top: 70, left: 10, right: 10, zIndex: 10, backgroundColor: 'white', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd'}}>
            <Text style={{fontWeight: '600', marginBottom: 8}}>Incoming video call</Text>
            <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12}}>
              <Pressable onPress={rejectCall} style={{paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#ddd', borderRadius: 6}}>
                <Text>Reject</Text>
              </Pressable>
              <Pressable onPress={acceptCall} style={{paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#5b0d63', borderRadius: 6}}>
                <Text style={{color: 'white'}}>Accept</Text>
              </Pressable>
            </View>
          </View>
        )}
        {messages?.map((item, index) => {
          return (
            <Pressable
              style={[
                item?.senderId == userId
                  ? {
                      alignSelf: 'flex-end',
                      backgroundColor: '#5b0d63',
                      padding: 10,
                      maxWidth: '60%',
                      borderRadius: 7,
                      margin: 10,
                    }
                  : {
                      alignSelf: 'flex-start',
                      backgroundColor: '#e1e3e3',
                      padding: 10,
                      maxWidth: '60%',
                      borderRadius: 7,
                      margin: 10,
                    },
              ]}
              key={item?.messageId || index}
              onLongPress={() => setReactionPickerFor(item?.messageId)}
            >
              {item?.type === 'audio' && item?.audioUrl ? (
                <View>
                  <Text
                    style={{
                      fontSize: 15,
                      textAlign: 'left',
                      letterSpacing: 0.3,
                      color: item?.senderId == userId ? 'white' : 'black',
                      marginBottom: 6,
                    }}>
                    Voice message
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL(item.audioUrl)}
                    style={{backgroundColor: item?.senderId == userId ? '#7b3d84' : '#cfd2d2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6}}
                  >
                    <Text style={{color: item?.senderId == userId ? 'white' : 'black'}}>Play</Text>
                  </Pressable>
                </View>
              ) : item?.type === 'image' && item?.imageUrl ? (
                <Pressable onPress={() => setFullImageUrl(item.imageUrl)}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 180, height: 220, borderRadius: 8, backgroundColor: '#ddd' }}
                  />
                </Pressable>
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    textAlign: 'left',
                    letterSpacing: 0.3,
                    color: item?.senderId == userId ? 'white' : 'black',
                  }}>
                  {item?.message}
                </Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: item?.senderId == userId ? '#e0d7e5' : '#666',
                  }}>
                  {formatTime(item?.timestamp)}
                </Text>
                {item?.senderId == userId ? (
                  <Text style={{ fontSize: 11, color: '#e0d7e5' }}>
                    {item?.readAt ? 'Read' : item?.deliveredAt ? 'Delivered' : 'Sent'}
                  </Text>
                ) : null}
              </View>

              {/* Reactions summary */}
              {Array.isArray(localReactions[item?.messageId]) && localReactions[item?.messageId].length > 0 && (
                <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
                  {Object.entries(localReactions[item?.messageId].reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {})).map(([emoji, count], idx) => (
                    <View key={idx} style={{ backgroundColor: item?.senderId == userId ? '#7b3d84' : '#cfd2d2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: item?.senderId == userId ? 'white' : 'black' }}>{emoji} {count}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Reaction picker */}
              {reactionPickerFor === item?.messageId && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {['👍','❤️','😂'].map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        setReactionPickerFor(null);
                        const receiverId = route?.params?.receiverId;
                        socket?.emit('messages:reaction', { messageId: item?.messageId, reaction: emoji, senderId: userId, receiverId });
                        setLocalReactions(prev => {
                          const list = prev[item?.messageId] || [];
                          return { ...prev, [item?.messageId]: [...list, emoji] };
                        });
                      }}
                      style={{ backgroundColor: item?.senderId == userId ? '#7b3d84' : '#cfd2d2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}
                    >
                      <Text style={{ color: item?.senderId == userId ? 'white' : 'black', fontSize: 16 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Typing indicator */}
      {isTyping && (
        <View style={{paddingHorizontal: 10, paddingBottom: 6}}>
          <Text style={{fontSize: 12, color: '#666'}}>Typing…</Text>
        </View>
      )}

      {/* Saved openers (user-managed) */}
      {savedOpeners?.length > 0 && (
        <View style={{borderTopWidth: 1, borderTopColor: '#eee'}}>
          <Text style={{fontSize: 12, color: '#666', paddingHorizontal: 10, paddingTop: 8}}>Your saved openers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10, paddingVertical: 8}}>
            {savedOpeners.map(op => (
              <Pressable
                key={op?.openerId}
                onPress={() => setMessage(op?.text || '')}
                onLongPress={async () => {
                  try {
                    const token = await AsyncStorage.getItem('token');
                    await axios.delete(`${BASE_URL}/openers/${op?.openerId}`, {
                      params: { userId },
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setSavedOpeners(prev => prev.filter(item => item?.openerId !== op?.openerId));
                  } catch (e) {
                    console.log('Delete opener error', e?.response?.data || e?.message);
                  }
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  backgroundColor: '#f7f7f7',
                  marginRight: 8,
                }}
              >
                <Text style={{fontSize: 13, color: '#333'}}>{op?.text}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick replies (always available; fills input without sending) */}
      {messages?.length > 0 && (
        <View style={{borderTopWidth: 1, borderTopColor: '#f0f0f0'}}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 10, paddingVertical: 8}}
          >
            {[
              "That's interesting!",
              'Tell me more about that!',
              'Haha, nice! 😄',
              'Love that — how did you get into it?',
              'Sounds fun! Any plans this weekend?',
            ].map((txt, idx) => (
              <Pressable
                key={idx}
                onPress={() => setMessage(txt)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  backgroundColor: '#fafafa',
                  marginRight: 8,
                }}
              >
                <Text style={{fontSize: 13, color: '#333'}}>{txt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Image URL paste field */}
      {showImageField && (
        <View style={{ paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="Paste image URL (https://...)"
              placeholderTextColor="gray"
              style={{ flex: 1, borderColor: '#dddddd', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, height: 40, fontSize: 15 }}
            />
            <Pressable
              onPress={async () => {
                const receiverId = route?.params?.receiverId;
                if (!imageUrlInput?.trim() || !receiverId) return;
                try {
                  const payload = { senderId: userId, receiverId, message: '', type: 'image', imageUrl: imageUrlInput.trim() };
                  await axios.post(`${BASE_URL}/sendMessage`, payload);
                  socket?.emit('sendMessage', payload);
                  setImageUrlInput('');
                  setShowImageField(false);
                  setTimeout(() => { fetchMessages(); }, 120);
                } catch (e) {
                  console.log('Send image error', e?.response?.data || e?.message);
                }
              }}
              style={{ backgroundColor: '#662d91', paddingVertical: 8, borderRadius: 20, paddingHorizontal: 12 }}
            >
              <Text style={{ color: 'white' }}>Send Image</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: '#dddddd',
          marginBottom: 30,
          gap: 12,
        }}>
        <Pressable
          onPress={pickImageFromGallery}
          onLongPress={() => setShowImageField(prev => !prev)}
          style={{
            backgroundColor: '#eee',
            paddingVertical: 8,
            borderRadius: 20,
            paddingHorizontal: 10,
          }}
        >
          <Ionicons name="image-outline" size={20} color="#333" />
          {isUploadingImage ? (
            <Text style={{ fontSize: 10, color: '#666', marginLeft: 6 }}>Uploading…</Text>
          ) : null}
        </Pressable>
        <TextInput
          value={message}
          onChangeText={text => {
            setMessage(text);
            const senderId = userId;
            const receiverId = route?.params?.receiverId;
            if (!isBlocked && !blockedByPeer) {
              socket?.emit('typing', { senderId, receiverId });
            }
            // debounce stop typing
            if (stopTypingTimerRef.current) {
              clearTimeout(stopTypingTimerRef.current);
            }
            stopTypingTimerRef.current = setTimeout(() => {
              if (!isBlocked && !blockedByPeer) {
                socket?.emit('stopTyping', { senderId, receiverId });
              }
            }, 1200);
          }}
          placeholderTextColor="gray"
          placeholder={isBlocked || blockedByPeer ? 'Conversation blocked' : 'Type your message...'}
          editable={!isBlocked && !blockedByPeer}
          style={{
            flex: 1,
            borderColor: '#dddddd',
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 10,
            height: 40,
            fontSize: 15,
          }}
        />
        <Pressable
          onPress={async () => {
            try {
              if (!message?.trim()) return;
              setSavingOpener(true);
              const token = await AsyncStorage.getItem('token');
              const resp = await axios.post(`${BASE_URL}/openers`, { userId, text: message }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setSavedOpeners(prev => [...prev, resp?.data?.opener]);
            } catch (e) {
              console.log('Save opener error', e?.response?.data || e?.message);
            } finally {
              setSavingOpener(false);
            }
          }}
          style={{
            backgroundColor: '#eee',
            paddingVertical: 8,
            borderRadius: 20,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{textAlign: 'center', color: '#333'}}>{savingOpener ? 'Saving…' : 'Save'}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (isBlocked || blockedByPeer) return;
            sendMessage(userId, route?.params?.receiverId);
          }}
          style={{
            backgroundColor: '#662d91',
            paddingVertical: 8,
            borderRadius: 20,
            paddingHorizontal: 12,
          }}>
          <Text style={{textAlign: 'center', color: 'white'}}>{isBlocked || blockedByPeer ? 'Blocked' : 'Send'}</Text>
        </Pressable>
      </View>

      {/* Icebreaker suggestions when chat is empty */}
      {messages?.length === 0 && (
        <View style={{borderTopWidth: 1, borderTopColor: '#eee'}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10, paddingVertical: 8}}>
            {['What’s your go-to weekend plan?','Coffee or tea person?','Best trip you’ve ever taken?','What’s a hobby you love?','Your favorite comfort food?'].map((txt, idx) => (
              <Pressable
                key={idx}
                onPress={async () => {
                  try {
                    await axios.post(`${BASE_URL}/sendMessage`, { senderId: userId, receiverId: route?.params?.receiverId, message: txt });
                    socket?.emit('sendMessage', { senderId: userId, receiverId: route?.params?.receiverId, message: txt });
                    setTimeout(() => { fetchMessages(); }, 100);
                  } catch (e) {
                    console.log('Quick send error', e);
                  }
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  backgroundColor: '#fafafa',
                  marginRight: 8,
                }}
              >
                <Text style={{fontSize: 13, color: '#333'}}>{txt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({});
