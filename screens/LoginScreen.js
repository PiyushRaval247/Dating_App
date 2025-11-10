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
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;
      console.log('Login error:', status, message);
      if (status === 404) {
        setEmailError('Email not found');
      } else if (status === 401) {
        setPasswordError('Incorrect password');
      } else if (status === 400) {
        setGeneralError('Email and password are required');
      } else if (status === 403) {
        setGeneralError(message || 'Account issue: check your email or reset password');
      } else {
        setGeneralError('Login failed. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View style={{height: 200, backgroundColor: colors.primary, width: '100%'}}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 25,
          }}>
          <Image
            style={{width: 150, height: 80, resizeMode: 'contain'}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/4207/4207268.png',
            }}
          />
        </View>
        <Text
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 24,
            fontFamily: 'GeezaPro-bold',
            color: 'white',
          }}>
        SouleMate
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{flex: 1}}
      >
        <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
        <View style={{alignItems: 'center'}}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              marginTop: 25,
              color: colors.primary,
            }}>
            Designed to be deleted
          </Text>
        </View>

        {option == 'Sign In' && (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
            }}>
            <Image
              style={{width: 150, height: 80, resizeMode: 'contain'}}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/6809/6809493.png',
              }}
            />
          </View>
        )}

        <View style={{marginHorizontal: spacing.lg, marginTop: spacing.lg}}>
          {option == 'Sign In' ? (
            <>
              <View>
                <View style={{marginTop: spacing.md}}>
                  <TextInputField
                    label="Email"
                    value={word}
                    onChangeText={setWord}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    icon="mail-outline"
                    error={emailError}
                  />
                </View>

                <View style={{marginTop: spacing.md}}>
                  <TextInputField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    icon="lock-closed-outline"
                    secure
                    error={passwordError}
                  />
                </View>

                <View
                  style={{
                    marginTop: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#606060'}}>Keep me logged in</Text>
                  <Pressable onPress={() => console.log('Forgot Password')}>
                    <Text style={{color: colors.primary}}>Forgot Password</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <View>
              <LottieView
                source={require('../assets/login.json')}
                style={{
                  height: 180,
                  width: 300,
                  alignSelf: 'center',
                  marginTop: 40,
                  justifyContent: 'center',
                }}
                autoPlay
                loop={true}
                speed={0.7}
              />
            </View>
          )}

          <View style={{marginTop: 40}} />

          {!!generalError && (
            <View style={{marginHorizontal: 20, marginTop: 10, padding: 10, backgroundColor: '#fdecea', borderColor: '#f5c6cb', borderWidth: 1, borderRadius: 8}}>
              <Text style={{color: '#d32f2f'}}>{generalError}</Text>
            </View>
          )}

          <View style={{width: 300, alignSelf: 'center'}}>
            <PrimaryButton
              title="Create Account"
              onPress={createAccount}
              style={{
                backgroundColor: option == 'Create account' ? colors.primary : '#EFE8F4',
                marginBottom: spacing.sm,
              }}
              textStyle={{ color: option == 'Create account' ? 'white' : '#1A1A1A' }}
            />
            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              style={{
                backgroundColor: option == 'Sign In' ? colors.primary : '#EFE8F4',
              }}
              textStyle={{ color: option == 'Sign In' ? 'white' : '#1A1A1A' }}
            />
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
