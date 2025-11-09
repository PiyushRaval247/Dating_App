import React, {useEffect, useRef, useState, useContext} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, RTCView} from 'react-native-webrtc';
import {useSocketContext} from '../SocketContext';
import {AuthContext} from '../AuthContext';

const iceServers = [{urls: 'stun:stun.l.google.com:19302'}];

const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {socket} = useSocketContext();
  const {userId} = useContext(AuthContext);
  const peerId = route?.params?.peerId;
  const isCaller = !!route?.params?.isCaller;
  const displayName = route?.params?.name || peerId;

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [hasRemote, setHasRemote] = useState(false);

  // Attach streams to simple views: using texture-less placeholders
  // You can switch to RTCView for rendering if configured

  const cleanup = () => {
    try {
      socket?.emit('call:end', {from: userId, to: peerId});
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    try {
      localStreamRef.current?.getTracks()?.forEach(t => t.stop());
    } catch {}
    navigation.goBack();
  };

  useEffect(() => {
    const pc = new RTCPeerConnection({iceServers});
    pcRef.current = pc;

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket?.emit('webrtc:candidate', {
          from: userId,
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = event => {
      // Single remote stream expected
      const inbound = event.streams?.[0];
      remoteStreamRef.current = inbound;
      setRemoteStream(inbound);
      setHasRemote(!!inbound);
    };

    const startLocal = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({audio: true, video: true});
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } catch (e) {
        console.log('getUserMedia error', e?.message || e);
      }
    };

    const dialIfCaller = async () => {
      if (!isCaller) return;
      // Send invite for UI prompt
      socket?.emit('call:invite', {from: userId, to: peerId});

      const offer = await pc.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true});
      await pc.setLocalDescription(offer);
      socket?.emit('webrtc:offer', {from: userId, to: peerId, sdp: offer});
    };

    const onOffer = async ({from, sdp}) => {
      if (from !== peerId) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('webrtc:answer', {from: userId, to: peerId, sdp: answer});
    };

    const onAnswer = async ({from, sdp}) => {
      if (from !== peerId) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const onCandidate = async ({from, candidate}) => {
      if (from !== peerId) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.log('Error adding candidate', e);
      }
    };

    const onEnd = ({from}) => {
      if (from !== peerId) return;
      cleanup();
    };

    const setup = async () => {
      await startLocal();
      if (isCaller) await dialIfCaller();
    };

    setup();

    socket?.on('webrtc:offer', onOffer);
    socket?.on('webrtc:answer', onAnswer);
    socket?.on('webrtc:candidate', onCandidate);
    socket?.on('call:end', onEnd);

    return () => {
      socket?.off('webrtc:offer', onOffer);
      socket?.off('webrtc:answer', onAnswer);
      socket?.off('webrtc:candidate', onCandidate);
      socket?.off('call:end', onEnd);
      try {
        pcRef.current?.close();
      } catch {}
      try {
        localStreamRef.current?.getTracks()?.forEach(t => t.stop());
      } catch {}
    };
  }, [socket, userId, peerId, isCaller, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.videoArea}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream?.toURL?.()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <Text style={styles.subLabel}>{hasRemote ? 'Connected' : 'Ringing / Connecting...'}</Text>
        )}
        {localStream ? (
          <RTCView
            streamURL={localStream?.toURL?.()}
            style={styles.localPreview}
            objectFit="cover"
            mirror={true}
          />
        ) : null}
        <Text style={styles.label}>Video call with {displayName}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={cleanup} style={styles.endBtn}>
          <Text style={{color: 'white', fontWeight: '600'}}>End Call</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  videoArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  remoteVideo: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  localPreview: {position: 'absolute', right: 12, bottom: 80, width: 120, height: 160, borderRadius: 8, overflow: 'hidden'},
  label: {color: 'white', fontSize: 16, fontWeight: '600', position: 'absolute', top: 12},
  subLabel: {color: '#ddd', marginTop: 8},
  controls: {padding: 16, alignItems: 'center'},
  endBtn: {backgroundColor: '#e53935', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8},
});

export default VideoCallScreen;