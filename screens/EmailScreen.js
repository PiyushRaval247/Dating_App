import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import { colors } from '../utils/theme';
import Fontisto from '@react-native-vector-icons/fontisto';
import Ionicons from '@react-native-vector-icons/ionicons';
import NextButton from '../components/NextButton';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../utils/registrationUtils';

const EmailScreen = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('Email').then(progressData => {
      if (progressData) {
        setEmail(progressData.email || '');
      }
    });
  }, []);
  const handleNext = () => {
    if (email.trim() !== '') {
      saveRegistrationProgress('Email', {email});
    }
    navigation.navigate('Password', {
      email: email,
    });
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
            <Fontisto name="email" size={26} color="black" />
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
            fontWeight: '700',
            marginTop: 15,
            color: colors.text,
          }}>
          Provide your email
        </Text>

        <Text style={{marginTop: 10, fontSize: 15, color: colors.textMuted}}>
          Email Verification helps us keep the account secure
        </Text>

        <TextInput
          value={email}
          onChangeText={text => setEmail(text)}
          autoFocus={true}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSubtle}
          style={{
            width: 340,
            marginVertical: 10,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
  fontWeight: '700',
            fontSize: email ? 22 : 22,
            color: colors.text,
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />

        <Text style={{color: colors.textMuted, marginTop: 7, fontSize: 15}}>
          Note: You will be asked to verify your email
        </Text>

        <NextButton onPress={handleNext} />
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailScreen;

const styles = StyleSheet.create({});
