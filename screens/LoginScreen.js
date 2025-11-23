import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import React, {useState,useContext} from 'react';
import {useNavigation} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { colors, spacing, radii } from '../utils/theme';

const LoginScreen = () => {
  const [option, setOption] = useState('Sign In');
  const navigation = useNavigation();
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {token,setToken} = useContext(AuthContext);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Animations
  const headerPulse = React.useRef(new Animated.Value(1)).current;
  const ringScale = React.useRef(new Animated.Value(1)).current;
  const ringOpacity = React.useRef(new Animated.Value(0.6)).current;
  const bubble1 = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bubble2 = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bubble3 = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cardTranslate = React.useRef(new Animated.Value(20)).current;
  const cardOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Pulse animation for the heart icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerPulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(headerPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle ripple halo behind the heart
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.6,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Subtle background bubble drift animations
    const drift = (valXY, dx, dy, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(valXY, { toValue: { x: dx, y: dy }, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(valXY, { toValue: { x: 0, y: 0 }, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
    drift(bubble1, 12, -10, 5000).start();
    drift(bubble2, -16, 14, 6500).start();
    drift(bubble3, 8, 8, 7000).start();

    // Card fade-up on mount
    Animated.parallel([
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerPulse, cardTranslate, cardOpacity]);

  const createAccount = () => {
    setOption('Create account');

    navigation.navigate('Basic');
  };
  const handleLogin = async () => {
    setOption('Sign In');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Basic client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;
    if (!word) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(word)) {
      setEmailError('Enter a valid email');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (hasError) return;

    try {
      const user = {
        email: word,
        password: password,
      };

      const response = await axios.post(`${BASE_URL}/login`, user);

      const {token, IdToken, AccessToken} = response.data;

      await AsyncStorage.setItem('token', token);
      setToken(token);
      await AsyncStorage.setItem('idToken', IdToken);
      await AsyncStorage.setItem('accessToken', AccessToken);
      // Clear errors on successful login
      setEmailError('');
      setPasswordError('');
      setGeneralError('');
    } catch (error) {
        console.log('Login error full:', error);
        const status = error?.response?.status;
        const serverMessage = error?.response?.data?.message;
        const message = serverMessage || error?.message || 'Network Error';
        // If there is no response object, it's likely a network/connectivity issue
        if (!error?.response) {
          setGeneralError('Network Error: could not reach the server. Check your network or backend URL.');
        } else if (status === 404) {
          setEmailError('Email not found');
        } else if (status === 401) {
          setPasswordError('Incorrect password');
        } else if (status === 400) {
          setGeneralError('Email and password are required');
        } else if (status === 403) {
          setGeneralError(message || 'Account issue: check your email or reset password');
        } else {
          setGeneralError(message || 'Login failed. Please try again.');
        }
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.primary}}>
      {/* Full-screen decorative background */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primaryAlt, opacity: 0.25, transform: [{ translateX: bubble1.x }, { translateY: bubble1.y }] }} />
        <Animated.View style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#ffffff20', opacity: 0.22, transform: [{ translateX: bubble2.x }, { translateY: bubble2.y }] }} />
        <Animated.View style={{ position: 'absolute', top: 260, right: -80, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primaryAlt, opacity: 0.18, transform: [{ translateX: bubble3.x }, { translateY: bubble3.y }] }} />
      </View>

      {/* Header */}
      <View style={{height: 220, width: '100%'}}>
        <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 24}}>
          <View style={{ position: 'relative' }}>
            <Animated.View style={{ position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#ffffff40', transform: [{ scale: ringScale }], opacity: ringOpacity }} />
            <Animated.View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center', transform: [{ scale: headerPulse }] }}>
              <Ionicons name="heart" size={34} color="#fff" />
            </Animated.View>
          </View>
          <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.white }}>SouleMate</Text>
          <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 13, color: '#F0E6F5' }}>Find meaningful connections</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{flex: 1}}
      >
        <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
        {/* Removed segmented control; single login mode */}

        <View style={{marginHorizontal: spacing.lg, marginTop: spacing.md}}>
          {/* Transparent container over purple background */}
          <Animated.View style={{ backgroundColor: 'transparent', borderRadius: radii.lg, padding: spacing.md, borderWidth: 0, transform: [{ translateY: cardTranslate }], opacity: cardOpacity }}>
          {/* Always show login form */}
          <View>
            <View style={{marginTop: spacing.sm}}>
              <TextInputField
                label="Email"
                value={word}
                onChangeText={setWord}
                placeholder="you@example.com"
                keyboardType="email-address"
                icon="mail-outline"
                error={emailError}
                variant="dark"
              />
            </View>

            <View style={{marginTop: spacing.sm}}>
              <TextInputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                icon="lock-closed-outline"
                secure
                error={passwordError}
                variant="dark"
              />
            </View>

            <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ffffff80', marginRight: 8 }} />
                <Text style={{color: '#F0E6F5'}}>Keep me logged in</Text>
              </View>
              <Pressable onPress={() => console.log('Forgot Password')}>
                <Text style={{color: '#F0E6F5'}}>Forgot Password</Text>
              </Pressable>
          </View>
          </View>

          <View style={{marginTop: spacing.md}}>
            <PrimaryButton
              title={'Sign In'}
              onPress={handleLogin}
              iconName={'log-in-outline'}
              style={{ backgroundColor: colors.primaryAlt }}
            />
          </View>

          {/* Create Account secondary button below main */}
          <View style={{marginTop: spacing.md}}>
            <PrimaryButton
              title={'Create Account'}
              onPress={createAccount}
              iconName={'person-add-outline'}
              variant={'outline'}
            />
          </View>

          {!!generalError && (
            <View style={{marginHorizontal: 20, marginTop: 10, padding: 10, backgroundColor: '#fdecea', borderColor: '#f5c6cb', borderWidth: 1, borderRadius: 8}}>
              <Text style={{color: '#d32f2f'}}>{generalError}</Text>
            </View>
          )}
          {/* Social auth placeholders */}
          <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>or continue with</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <Pressable onPress={() => console.log('Google')} style={{ backgroundColor: '#F5F5F5', borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, marginRight: 12 }}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
              </Pressable>
              <Pressable onPress={() => console.log('Apple')} style={{ backgroundColor: '#000', borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 16 }}>
                <Ionicons name="logo-apple" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
          </Animated.View>
        </View>
        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
          <Text style={{ color: '#F0E6F5', fontSize: 12 }}>By continuing you agree to our Terms and Privacy Policy</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
