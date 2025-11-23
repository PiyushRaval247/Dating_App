import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import { Alert } from 'react-native';
import { colors } from '../utils/theme';
import { getContrastingTextColor } from '../utils/colorUtils';
import Ionicons from '@react-native-vector-icons/ionicons';
import NextButton from '../components/NextButton';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../utils/registrationUtils';

const NameScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('Name').then(progressData => {
      if (progressData) {
        setFirstName(progressData.firstName || '');
      }
    });
  }, []);
  const handleNext = () => {
    if (firstName.trim() === '') {
      setError('First name is required');
      Alert.alert('Missing information', 'Please enter your first name to continue.');
      return;
    }
    setError('');
    saveRegistrationProgress('Name', {firstName});
    navigation.navigate('Email');
  };
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      <Text style={{marginTop: 50, textAlign: 'center', color: colors.text}}>
        NO BACKGROUND CHECKS ARE CONDUCTED
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
      <View style={{marginTop: 30, marginHorizontal: 20}}>
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
            <Ionicons name="newspaper-outline" size={26} color="black" />
          </View>
          <Image
            style={{width: 100, height: 40}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
            }}
          />
        </View>

        <View style={{marginTop: 30}}>
          <Text
            style={{
              fontSize: 25,
              fontWeight: '700',
              color: colors.text,
            }}>
            What's your name?
          </Text>
          <TextInput
            value={firstName}
            onChangeText={text => setFirstName(text)}
            autoFocus={true}
            placeholder="First name (required)"
            placeholderTextColor={colors.textSubtle}
            style={{
              width: 340,
              marginVertical: 10,
              marginTop: 25,
              borderBottomColor: 'black',
              borderBottomWidth: 1,
              paddingBottom: 10,
  fontWeight: '700',
              fontSize: firstName ? 22 : 22,
              color: colors.text,
            }}
          />
          {error ? <Text style={{color: '#d32f2f', marginTop: 8}}>{error}</Text> : null}
          <TextInput
            placeholder="Last Name"
            placeholderTextColor={colors.textSubtle}
            style={{
              width: 340,
              marginVertical: 10,
              marginTop: 25,
              borderBottomColor: 'black',
              borderBottomWidth: 1,
              paddingBottom: 10,
  fontWeight: '700',
              fontSize: firstName ? 22 : 22,
              color: colors.text,
            }}
          />
          <Text style={{fontSize: 15, color: colors.textMuted, fontWeight: '500'}}>
            Last name is optional
          </Text>
        </View>

        <NextButton onPress={handleNext} />
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NameScreen;

const styles = StyleSheet.create({});
