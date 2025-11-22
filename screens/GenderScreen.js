import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import React, {useState,useEffect} from 'react';
import { Alert } from 'react-native';
import { colors } from '../utils/theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import NextButton from '../components/NextButton';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

const GenderScreen = () => {
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();  
  useEffect(() => {
    getRegistrationProgress('Gender').then(progressData => {
      if(progressData){
        setGender(progressData.gender || '');
      }
    })
  },[]) 
  const handleNext = () => {
    if (gender.trim() === '') {
      setError('Please select a gender');
      Alert.alert('Missing information', 'Please select your gender to continue');
      return;
    }
    setError('');
    saveRegistrationProgress('Gender',{gender});
    navigation.navigate("Type");
  }
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: 'white',
      }}>
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
            <MaterialDesignIcons name="gender-male" size={23} color="black" />
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
          Which gender describes you the best
        </Text>

        <Text style={{fontSize: 15, marginTop: 20, color: colors.textMuted}}>
  SouleMate users are matched based on these gender groups. You can add more
          about gender after registering
        </Text>

        <View style={{marginTop: 30}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Men</Text>
            <Pressable onPress={() => setGender('Men')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Men' ? '#581845' : '#F0F0F0'}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical: 12,
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Women</Text>
            <Pressable onPress={() => setGender('Women')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Women' ? '#581845' : '#F0F0F0'}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Non Binary</Text>
            <Pressable onPress={() => setGender('Non Binary')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Non Binary' ? '#581845' : '#F0F0F0'}
              />
            </Pressable>
          </View>

          <View
          style={{
            marginTop: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
         <MaterialDesignIcons name="checkbox-marked" size={25} color="#900C3F" />
          <Text style={{fontSize: 15, color: colors.text}}>Visible on profile</Text>
        </View>



        </View>

        <NextButton onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
};

export default GenderScreen;

const styles = StyleSheet.create({});
