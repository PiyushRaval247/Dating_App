import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  TextInput,
  Button,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../urls/url';

const OtpScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();
  const email = route?.params?.email;

  const handleConfirmSignUp = async () => {
      console.log("working");

      const otpCode = otp.join('');
      console.log("OTP ",otpCode);
      if(!email || !otpCode){
        return;
      }

      try{
        const response = await axios.post(`${BASE_URL}/confirmSignup`,{email,otpCode});

        if(response.status == 200){
          console.log("response",response);
          navigation.navigate("Birth")
        }
      } catch(error){
        console.log("Error confirming the signup",error)
      }

      // navigation.navigate("Birth")
  }

  useEffect(() => {
    if(otp.every(digit => digit !== '')){
        handleConfirmSignUp()
    }
  },[otp])

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };
  const handleBackspace = (text, index) => {
      if(!text && index > 0){
        inputs.current[index - 1].focus();
      }

      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
  };
 
  console.log("OTP",otp);
  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);

    try{
      const response = await axios.post(`${BASE_URL}/resendOtp`,{
        email:email,
      });

      console.log("response",response.data)
    } catch(error){
      console.log("Error resending the otp",error)
    }
  }
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
      }}>
      <View
        style={{
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 50,
        }}>
        <Text style={{fontSize: 18, fontWeight: '500'}}>Verification code</Text>
        <Text style={{fontSize: 14, color: 'gray', marginTop: 5}}>
          Enter the 6 digit code sent to your email
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '80%',
          marginTop: 30,
        }}>
        {otp?.map((_, index) => (
          <TextInput
            key={index}
            style={{
              width: 45,
              height: 45,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              textAlign: 'center',
              fontSize: 18,
              color: '#333',
            }}
            ref={el => (inputs.current[index] = el)}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[index]}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key == 'Backspace') {
                handleBackspace('', index);
              }
            }}
            autoFocus={index === 0}
          />
        ))}
      </View>

      <View style={{marginTop:30}}/>

      <Button onPress={handleResendOtp} title="Resend Code"/>
    </SafeAreaView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({});
