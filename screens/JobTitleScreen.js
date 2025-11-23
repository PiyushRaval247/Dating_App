import {
  Image,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState,useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

import { colors } from '../utils/theme';
const JobTitleScreen = () => {
  const [jobTitle, setJobTitle] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('JobTitle').then(progressData => {
      if(progressData){
        setJobTitle(progressData.jobTitle);
      }
    })
  },[])
  const handleNext = () => {
    if(jobTitle.trim() !== ''){
      saveRegistrationProgress('JobTitle',{jobTitle});
    }
    navigation.navigate("Photos");
  }
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
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
            <MaterialDesignIcons
              name="lan"
              size={23}
              color="black"
            />
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
          What's your job title?
        </Text>

        <TextInput
          autoFocus={true}
          value={jobTitle}
          onChangeText={text => setJobTitle(text)}
          placeholder="Enter your job title"
          style={{
            width: 340,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
  fontWeight: '700',
            fontSize: jobTitle ? 22 : 22,
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

export default JobTitleScreen;

const styles = StyleSheet.create({});
