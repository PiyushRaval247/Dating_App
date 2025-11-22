import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Image,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, {useState,useEffect} from 'react';
import { Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../utils/theme';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

const DatingType = () => {
  const [datingPreferences, setDatingPreferences] = useState([]);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const chooseOption = option => {
    if (datingPreferences.includes(option)) {
      setDatingPreferences(
        datingPreferences.filter(selectedOption => selectedOption !== option),
      );
    }else{
        setDatingPreferences([...datingPreferences,option]);
    }
  };
  useEffect(() => {
    getRegistrationProgress('Dating').then(progressData => {
      if(progressData){
        setDatingPreferences(progressData.datingPreferences || []);
      }
    })
  },[])
  const handleNext = () => {
    if (datingPreferences.length === 0) {
      setError('Please select at least one dating preference');
      Alert.alert('Missing information', 'Select at least one dating preference to continue');
      return;
    }
    setError('');
    saveRegistrationProgress('Dating',{datingPreferences});
    navigation.navigate("LookingFor");
  }
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      <View style={{marginTop: 80, marginHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: colors.text,
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
          Who do you want to date?
        </Text>

        <Text style={{fontSize: 15, marginTop: 20, color: colors.text}}>
          Select all people you're open to meeting
        </Text>

        <View style={{marginTop: 30, flexDirection: 'column', gap: 12}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Men</Text>
            <Pressable onPress={() => chooseOption('Men')}>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  datingPreferences.includes('Men') ? colors.primary : colors.border
                }
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Women</Text>
            <Pressable onPress={() => chooseOption('Women')}>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  datingPreferences.includes('Women') ? colors.primary : colors.border
                }
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Everyone</Text>
            <Pressable onPress={() => chooseOption('Everyone')}>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  datingPreferences.includes('Everyone') ? colors.primary : colors.border
                }
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
            <MaterialDesignIcons
              name="checkbox-marked"
              size={25}
              color={colors.primaryAlt}
            />
            <Text style={{fontSize: 15, color: colors.text}}>Visible on profile</Text>
          </View>
        </View>

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
    </SafeAreaView>
  );
};

export default DatingType;

const styles = StyleSheet.create({});
