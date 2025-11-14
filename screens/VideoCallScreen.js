import React, {useContext, useMemo, useEffect, useState} from 'react';
import {View, Text, Platform, PermissionsAndroid} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ZEGOCLOUD_APP_ID, ZEGOCLOUD_APP_SIGN, buildRoomId } from '../utils/zegoConfig';

const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userId} = useContext(AuthContext);
  const peerId = route?.params?.peerId;
  const displayName = route?.params?.name || String(peerId || 'Unknown');

  const callID = useMemo(() => buildRoomId(userId, peerId), [userId, peerId]);
  const [permissionsOk, setPermissionsOk] = useState(true);

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

  const missingCreds = !ZEGOCLOUD_APP_ID || !ZEGOCLOUD_APP_SIGN;

  const noPeer = !peerId || !userId;

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
      ) : !permissionsOk ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            Camera/Microphone permission is required for video calls. Please grant permissions in Android settings.
          </Text>
        </View>
      ) : (
        <ZegoUIKitPrebuiltCall
          appID={Number(ZEGOCLOUD_APP_ID)}
          appSign={String(ZEGOCLOUD_APP_SIGN)}
          userID={String(userId)}
          userName={String(displayName)}
          callID={String(callID)}
          config={{
            ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
            onCallEnd: () => {
              // End-call callback from ZEGOCLOUD UI; return to previous screen
              navigation.goBack();
            },
          }}
        />
      )}
    </View>
  );
};

export default VideoCallScreen;