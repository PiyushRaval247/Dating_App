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
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../utils/theme';
import { getRegistrationProgress, saveRegistrationProgress } from '../utils/registrationUtils';

const TypeScreen = () => {
  const [type, setType] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getRegistrationProgress('Type').then(progressData => {
      if(progressData){
        setType(progressData.type || '');
      }
    })
  },[])
  const handleNext = () => {
    if(type.trim() != ''){
      saveRegistrationProgress('Type',{type});
    }
    navigation.navigate("Dating")
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
          What's your sexuality?
        </Text>

        <Text style={{fontSize: 15, marginTop: 20, color: colors.text}}>
  SouleMate users are matched based on these gender groups. You can add more
          about gender after registering
        </Text>

        <View style={{marginTop: 30, flexDirection: 'column', gap: 12}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Straight</Text>
            <Pressable onPress={() => setType('Straight')}>
              <FontAwesome
                name="circle"
                size={26}
                color={type == 'Straight' ? colors.primary : colors.border}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Gay</Text>
            <Pressable onPress={() => setType('Gay')}>
              <FontAwesome
                name="circle"
                size={26}
                color={type == 'Gay' ? colors.primary : colors.border}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Lesbian</Text>
            <Pressable onPress={() => setType('Lesbian')}>
              <FontAwesome
                name="circle"
                size={26}
                color={type == 'Lesbian' ? colors.primary : colors.border}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>Bisexual</Text>
            <Pressable onPress={() => setType('Bisexual')}>
              <FontAwesome
                name="circle"
                size={26}
                color={type == 'Bisexual' ? colors.primary : colors.border}
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
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TypeScreen;

const styles = StyleSheet.create({});
