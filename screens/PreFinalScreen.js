import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import React, {useState, useEffect, useContext} from 'react';
import { colors } from '../utils/theme';
import LottieView from 'lottie-react-native';
import {useNavigation} from '@react-navigation/native';
import {getRegistrationProgress} from '../utils/registrationUtils';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../AuthContext';
import { resetToMain } from '../navigation/RootNavigation';

const PreFinalScreen = () => {
  const [userData, setUserData] = useState();
  const {token, setToken} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
    getAllUserData();
  }, []);

  console.log('User', userData);

  const getAllUserData = async () => {
    try {
      const screens = [
        'Name',
        'Email',
        'Password',
        'Birth',
        'Location',
        'Gender',
        'Type',
        'Dating',
        'LookingFor',
        'Hometown',
        // Read standardized and legacy keys to avoid missing data
        'Workplace',
        'WorkPlace',
        'JobTitle',
        'Photos',
        'Prompts',
      ];

      let userData = {};

      for (const screenName of screens) {
        const screenData = await getRegistrationProgress(screenName);
        console.log('Screen data', screenData);
        if (screenData) {
          userData = {...userData, ...screenData};
        }
      }

      setUserData(userData);
    } catch (error) {
      console.log('Error', error);
    }
  };

  const clearAllScreenData = async () => {
    try {
      const screens = [
        'Name',
        'Email',
        'Password',
        'Birth',
        'Location',
        'Gender',
        'Type',
        'Dating',
        'LookingFor',
        'Hometown',
        'Workplace',
        'WorkPlace',
        'JobTitle',
        'Photos',
        'Prompts',
      ];

      for (const screenName of screens) {
        const key = `registration_progress_${screenName}`;
        await AsyncStorage.removeItem(key);
      }

      console.log('All screen data cleared!');
    } catch (error) {
      console.log('Error', error);
    }
  };

  const registerUser = async () => {
    try {
      setLoading(true);
      const imgs = Array.isArray(userData?.imageUrls) ? userData.imageUrls : [];
      const toUpload = imgs.filter(u => typeof u === 'string' && /base64,/.test(u));
      const uploaded = await Promise.all(
        toUpload.map(async (dataUrl) => {
          try {
            const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
            const ext = (match && match[1] && match[1].includes('png')) ? 'png' : 'jpg';
            const base64 = match ? match[2] : '';
            if (!base64) return null;
            const resp = await axios.post(`${BASE_URL}/upload-image`, { imageBase64: base64, ext });
            const url = resp?.data?.url;
            if (typeof url === 'string' && url.startsWith('/')) return `${BASE_URL}${url}`;
            return typeof url === 'string' ? url : null;
          } catch (e) {
            return null;
          }
        })
      );
      const uploadedMap = new Map();
      toUpload.forEach((k, i) => uploadedMap.set(k, uploaded[i]));
      const normalized = imgs.map((u) => {
        if (typeof u !== 'string' || !u.trim()) return null;
        if (/^https?:\/\//i.test(u)) return u;
        if (u.startsWith('/uploads/')) return `${BASE_URL}${u}`;
        if (/base64,/.test(u)) return uploadedMap.get(u) || null;
        return null;
      }).filter(Boolean);

      const payload = { ...userData, imageUrls: normalized };
      const response = await axios.post(`${BASE_URL}/register`, payload);
      
      console.log('Response', response);
      const token = response?.data?.token;
      if (!token || typeof token !== 'string' || token.trim().length < 10) {
        setLoading(false);
        Alert.alert('Registration failed', 'No token returned. Please try again.');
        return;
      }
      await AsyncStorage.setItem('token', token);
      setToken(token);

      await clearAllScreenData();
      // Perform a root-level reset to Main once NavigationContainer is ready.
      // Using the global ref avoids stack mismatch during Auth->Main switch.
      setTimeout(() => {
        resetToMain();
      }, 200);
    } catch (error) {
      console.log('Error registering user:', error);
      // Add user feedback here if needed
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      <View style={{marginTop: 80}}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            marginLeft: 20,
            color: colors.text,
          }}>
          All set to register.
        </Text>

        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            marginLeft: 20,
            marginTop: 10,
            color: colors.text,
          }}>
          Setting up your profile for you.
        </Text>
      </View>

      <View>
        <LottieView
          style={{
            height: 260,
            width: 300,
            alignSelf: 'center',
            marginTop: 40,
            justifyContent: 'center',
          }}
          source={require('../assets/love.json')}
          autoPlay
          loop={true}
          speed={0.7}
        />
      </View>

      <Pressable
        onPress={registerUser}
        style={{marginTop: 'auto', backgroundColor: '#900C3F', padding: 15}}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            style={{
              textAlign: 'center',
              color: colors.white,
              fontWeight: '600',
              fontSize: 15,
            }}>
            Finish Registering
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default PreFinalScreen;

const styles = StyleSheet.create({});
