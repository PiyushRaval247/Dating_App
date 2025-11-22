import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View ,SafeAreaView, KeyboardAvoidingView, ScrollView} from 'react-native'
import React, { useState ,useEffect, useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../utils/theme';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkPlace = () => {
    const [workPlace,setWorkPlace] = useState("");
    const navigation = useNavigation();
    const route = useRoute();
    const { userInfo, setUserInfo, userId, token } = useContext(AuthContext);
    useEffect(() => {
      // Prefer the standardized key 'Workplace', fallback to legacy 'WorkPlace'
      (async () => {
        const primary = await getRegistrationProgress('Workplace');
        if (primary && typeof primary.workPlace === 'string') {
          setWorkPlace(primary.workPlace);
          return;
        }
        const legacy = await getRegistrationProgress('WorkPlace');
        if (legacy && typeof legacy.workPlace === 'string') {
          setWorkPlace(legacy.workPlace);
        }
      })();
    },[])
    const handleNext = async () => {
       if(workPlace.trim() !== ''){
         // Save using standardized key to ensure PreFinal aggregation picks it up
         saveRegistrationProgress('Workplace',{workPlace});
       }
       // If opened from Profile completion chips, go back instead of onboarding flow
       if (route?.params?.fromProfile) {
         try {
           const authToken = token || (await AsyncStorage.getItem('token'));
           if (userId && authToken) {
             const resp = await axios.patch(`${BASE_URL}/user-info`, { userId, workPlace }, {
               headers: { Authorization: `Bearer ${authToken}` },
             });
             const updated = resp?.data?.user;
             if (updated) {
               setUserInfo && setUserInfo(updated);
             } else {
               setUserInfo && setUserInfo({ ...(userInfo || {}), workPlace });
             }
           } else {
             setUserInfo && setUserInfo({ ...(userInfo || {}), workPlace });
           }
         } catch (error) {
           console.log('Error updating workplace', error?.response?.data || error?.message);
           setUserInfo && setUserInfo({ ...(userInfo || {}), workPlace });
         }
         navigation.goBack();
       } else {
         navigation.navigate("JobTitle");
       }
    }
  return (
    <SafeAreaView
    style={{
      paddingTop: Platform.OS === 'android' ? 35 : 0,
      flex: 1,
      backgroundColor: colors.card,
    }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={{flex:1}}>
    <ScrollView contentContainerStyle={{flexGrow:1}} keyboardShouldPersistTaps="handled">
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
          <MaterialDesignIcons name="briefcase-outline" size={23} color="black" />
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
        Where do you work?
      </Text>

      <TextInput
        autoFocus={true}
        value={workPlace}
        onChangeText={text => setWorkPlace(text)}
        placeholder="Enter your workplace"
        style={{
          width: 340,
          marginTop: 25,
          borderBottomColor: colors.text,
          borderBottomWidth: 1,
          paddingBottom: 10,
  fontWeight: '700',
          fontSize: workPlace ? 22 : 22,
          color: colors.text,
        }}
        placeholderTextColor={'#BEBEBE'}
      />

      <TouchableOpacity
          onPress={handleNext}
        activeOpacity={0.8}
        style={{marginTop: 30, marginLeft: 'auto'}}>
        <Ionicons
          name="chevron-forward-circle-outline"
          size={45}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  )
}

export default WorkPlace

const styles = StyleSheet.create({})