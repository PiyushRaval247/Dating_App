import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import React from 'react';
import MaterialDesignIcons from '@react-native-vector-icons/material-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import { saveRegistrationProgress } from '../utils/registrationUtils';
import axios from 'axios';
import { BASE_URL } from '../urls/url';

const PasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const email = route?.params?.email;
  const handleSendOtp = async () => {
    if(!email){
      return;
    }

    try{
      const response = await axios.post(`${BASE_URL}/sendOtp`,{
        email,
        password
      });
      console.log(response.data.message);
      navigation.navigate('Otp', {email});

    } catch(error){
      console.log("Error sending the OTP",error)
    }
  }
  const handleNext = () => {
    if(password.trim() !== ''){
      saveRegistrationProgress('Password',{password});
    }
    // navigation.navigate('Otp', {email});

    handleSendOtp();
  };
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: 'white',
      }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
      <View style={{marginTop: 80, marginHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: 'black',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialDesignIcons name="lock" size={26} color="black" />
          </View>
          <Image
            style={{width: 100, height: 40}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
            }}
          />
        </View>

        <Text
          style={{
            fontSize: 25,
            fontWeight: 'bold',
            fontFamily: 'GeezaPro-Bold',
            marginTop: 15,
          }}>
          Please choose a password
        </Text>

        <View
          style={{
            width: 340,
            marginVertical: 10,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
            position: 'relative',
          }}
        >
          <TextInput
            value={password}
            onChangeText={text => setPassword(text)}
            autoFocus={true}
            placeholder="Enter your Password"
            secureTextEntry={!showPassword}
            placeholderTextColor={'#BEBEBE'}
            style={{
              fontFamily: 'GeezaPro-Bold',
              fontSize: 22,
              color: '#000',
              paddingRight: 40,
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
            }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityHint="Toggles password visibility"
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#581845" />
          </TouchableOpacity>
        </View>

        <Text style={{color: 'gray', marginTop: 7, fontSize: 15}}>
          Note: You details will be safe with us
        </Text>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{marginTop: 30, marginLeft: 'auto'}}>
          <Ionicons
            name="chevron-forward-circle-outline"
            size={45}
            color="#581845"
          />
        </TouchableOpacity>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordScreen;

const styles = StyleSheet.create({});
