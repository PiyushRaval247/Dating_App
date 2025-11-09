import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useState,useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

const LookingFor = () => {
  const [lookingFor, setLookingFor] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('LookingFor').then(progressData => {
      if(progressData){
        setLookingFor(progressData.lookingFor || '');
      }
    })
  },[])
  const handleNext = () => {
    if(lookingFor.trim() !== ''){
      saveRegistrationProgress('LookingFor',{lookingFor})
    }
    navigation.navigate("Hometown")
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
            <MaterialDesignIcons name="hand-heart" size={23} color="black" />
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
          What's your dating intention?
        </Text>

        <Text style={{fontSize: 15, marginTop: 20, color: 'gray'}}>
          Select all people you're open to meeting
        </Text>

        <View style={{marginTop: 30, flexDirection: 'column', gap: 12}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500'}}>Life Partner</Text>
            <Pressable onPress={() => setLookingFor('Life Partner')}>
              <FontAwesome
                name="circle"
                size={26}
                color={lookingFor == 'Life Partner' ? '#581845' : '#F0F0F0'}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500'}}>
              Long-term relationship
            </Text>
            <Pressable onPress={() => setLookingFor('Long-term relationship')}>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  lookingFor == 'Long-term relationship' ? '#581845' : '#F0F0F0'
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
            <Text style={{fontSize: 15, fontWeight: '500'}}>
              Long-term relationship open to short
            </Text>
            <Pressable
              onPress={() =>
                setLookingFor('Long-term relationship open to short')
              }>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  lookingFor == 'Long-term relationship open to short'
                    ? '#581845'
                    : '#F0F0F0'
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
            <Text style={{fontSize: 15, fontWeight: '500'}}>
             Short-term relationship open to long
            </Text>
            <Pressable
              onPress={() =>
                setLookingFor('Short-term relationship open to long')
              }>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  lookingFor == 'Short-term relationship open to long'
                    ? '#581845'
                    : '#F0F0F0'
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
            <Text style={{fontSize: 15, fontWeight: '500'}}>
              Short-term relationship
            </Text>
            <Pressable
              onPress={() =>
                setLookingFor('Short-term relationship')
              }>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  lookingFor == 'Short-term relationship'
                    ? '#581845'
                    : '#F0F0F0'
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
            <Text style={{fontSize: 15, fontWeight: '500'}}>
              Figuring out my dating goals
            </Text>
            <Pressable
              onPress={() =>
                setLookingFor('Figuring out my dating goals')
              }>
              <FontAwesome
                name="circle"
                size={26}
                color={
                  lookingFor == 'Figuring out my dating goals'
                    ? '#581845'
                    : '#F0F0F0'
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
              color="#900C3F"
            />
            <Text style={{fontSize: 15}}>Visible on profile</Text>
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

export default LookingFor;

const styles = StyleSheet.create({});
