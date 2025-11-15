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
import React, {useState,useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

const HomeTownScreen = () => {
  const [hometown, setHomeTown] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('Hometown').then(progressData => {
      if(progressData){
        setHomeTown(progressData.hometown);
      }
    })
  },[])
  const handleNext = () => {
    if(hometown.trim() !== ''){
      saveRegistrationProgress('Hometown',{hometown});
    }
      navigation.navigate("Workplace")
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
            <MaterialDesignIcons name="location-enter" size={23} color="black" />
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
  fontWeight: '700',
            marginTop: 15,
          }}>
          Where's your hometown?
        </Text>

        <TextInput
          autoFocus={true}
          value={hometown}
          onChangeText={text => setHomeTown(text)}
          placeholder="Enter your hometown"
          style={{
            width: 340,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
  fontWeight: '700',
            fontSize: hometown ? 22 : 22,
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
  );
};

export default HomeTownScreen;

const styles = StyleSheet.create({});
