import React, {useContext, useMemo, useEffect, useState} from 'react';
import {View, Text, Platform, PermissionsAndroid, TouchableOpacity, Image} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ZEGOCLOUD_APP_ID, ZEGOCLOUD_APP_SIGN, buildRoomId } from '../utils/zegoConfig';
import { useSocketContext } from '../SocketContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../utils/theme';

const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userId} = useContext(AuthContext);
  const peerId = route?.params?.peerId;
  const displayName = route?.params?.name || String(peerId || 'Unknown');
  const avatar = route?.params?.image || null;
  const isCaller = !!route?.params?.isCaller;
  const deferredStart = !!route?.params?.deferredStart;
  const { socket } = useSocketContext();

  const callID = useMemo(() => buildRoomId(userId, peerId), [userId, peerId]);
  const [permissionsOk, setPermissionsOk] = useState(true);
  const [canStart, setCanStart] = useState(!(isCaller && deferredStart));

  useEffect(() => {
    const ensurePermissions = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const cam = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const mic = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setPermissionsOk(cam === PermissionsAndroid.RESULTS.GRANTED && mic === PermissionsAndroid.RESULTS.GRANTED);
      } catch {
        setPermissionsOk(false);
      }
    };
    ensurePermissions();
  }, []);

  // Caller waits for accept before starting ZEGOCLOUD UI
  useEffect(() => {
    if (!socket || !isCaller || !deferredStart || canStart !== false) return;
    const onAccepted = (payload) => {
      try {
        const from = payload?.from; // server sends callee id as 'from'
        if (String(from) !== String(peerId)) return;
        setCanStart(true);
      } catch {}
    };
    const onRejected = (payload) => {
      try {
        const from = payload?.from;
        if (String(from) !== String(peerId)) return;
        // Return back if rejected
        navigation.goBack();
      } catch {}
    };
    socket.on('call:accepted', onAccepted);
    socket.on('call:rejected', onRejected);
    return () => {
      socket.off('call:accepted', onAccepted);
      socket.off('call:rejected', onRejected);
    };
  }, [socket, isCaller, deferredStart, canStart, peerId, navigation]);

  // End call when remote sends call:end (both sides react)
  useEffect(() => {
    if (!socket) return;
    const onEnded = (payload) => {
      try {
        navigation.goBack();
      } catch {}
    };
    socket.on('call:end', onEnded);
    return () => {
      socket.off('call:end', onEnded);
    };
  }, [socket, navigation]);

  const missingCreds = !ZEGOCLOUD_APP_ID || !ZEGOCLOUD_APP_SIGN;

  const noPeer = !peerId || !userId;
  const selfCall = String(userId) === String(peerId);

  return (
    <View style={{flex: 1}}>
      {missingCreds ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            ZEGOCLOUD credentials are not set. Please update `utils/zegoConfig.js` with your `ZEGOCLOUD_APP_ID` and `ZEGOCLOUD_APP_SIGN`.
          </Text>
        </View>
      ) : noPeer ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            Missing peer or user info. Please start a call from a chat.
          </Text>
        </View>
      ) : selfCall ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            You can’t start a video call with yourself. Please call a different user.
          </Text>
        </View>
      ) : !permissionsOk ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            Camera/Microphone permission is required for video calls. Please grant permissions in Android settings.
          </Text>
        </View>
      ) : canStart ? (
        <ZegoUIKitPrebuiltCall
          appID={Number(ZEGOCLOUD_APP_ID)}
          appSign={String(ZEGOCLOUD_APP_SIGN)}
          userID={String(userId)}
          userName={String(displayName)}
          callID={String(callID)}
          config={{
            ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
            // Ensure local media is enabled on join
            turnOnCameraWhenJoining: true,
            turnOnMicrophoneWhenJoining: true,
            onCallEnd: () => {
              // End-call callback from ZEGOCLOUD UI; notify peer and return
              try {
                socket?.emit('call:end', { from: userId, to: peerId });
              } catch {}
              navigation.goBack();
            },
          }}
        />
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#0f1115'}}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 18, backgroundColor: '#222' }} />
          ) : (
            <Ionicons name="person-circle-outline" size={120} color="#888" style={{ marginBottom: 18 }} />
          )}
          <Ionicons name="videocam" size={28} color={colors.textSubtle} />
          <Text style={{marginTop: 10, fontSize: 20, color: colors.white, fontWeight: '600'}}>{displayName}</Text>
          <Text style={{marginTop: 6, fontSize: 14, color: colors.textSubtle}}>Calling… Waiting for acceptance</Text>
          {isCaller ? (
            <TouchableOpacity
              onPress={() => {
                try {
                  socket?.emit('call:end', { from: userId, to: peerId });
                } catch {}
                navigation.goBack();
              }}
              style={{ position: 'absolute', bottom: 40, width: 66, height: 66, borderRadius: 33, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default VideoCallScreen;