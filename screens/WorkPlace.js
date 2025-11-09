import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View ,SafeAreaView, KeyboardAvoidingView, ScrollView} from 'react-native'
import React, { useState ,useEffect, useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
      getRegistrationProgress('WorkPlace').then(progressData => {
       if(progressData){
         setWorkPlace(progressData.workPlace);
       }
      })
    },[])
    const handleNext = async () => {
       if(workPlace.trim() !== ''){
         saveRegistrationProgress('WorkPlace',{workPlace});
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
      backgroundColor: 'white',
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
            borderColor: 'black',
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
          fontWeight: 'bold',
          fontFamily: 'GeezaPro-Bold',
          marginTop: 15,
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
          borderBottomColor: 'black',
          borderBottomWidth: 1,
          paddingBottom: 10,
          fontFamily: 'GeezaPro-Bold',
          fontSize: workPlace ? 22 : 22,
          color: '#000',
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
          color="#581845"
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