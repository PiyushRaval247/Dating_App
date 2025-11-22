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
import React, {useState, useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import EvilIcons from '@react-native-vector-icons/evil-icons';
import AntDesign from '@react-native-vector-icons/ant-design';
import {useNavigation, useRoute} from '@react-navigation/native';
import { saveRegistrationProgress } from '../utils/registrationUtils';
import { getContrastingTextColor } from '../utils/colorUtils';
import BackHeader from '../components/BackHeader';

const PromptsScreen = () => {
  const [prompts, setPrompts] = useState([
    {question: '', answer: ''},
    {question: '', answer: ''},
    {question: '', answer: ''},
  ]);
  const route = useRoute();
  const navigation = useNavigation();
  useEffect(() => {
    if (route?.params?.updatedPrompts) {
      setPrompts(route?.params?.updatedPrompts);
    }
  }, [route.params]);
  const handleNext = () => {
    saveRegistrationProgress('Prompts',{prompts:prompts})
    navigation.navigate("PreFinal")
  }
  return (

    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: 'white',
      }}>
      <BackHeader title="Prompts" />
      <View style={{marginTop: 20, marginHorizontal: 20}}>
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
            <AntDesign name="eye" size={23} color="black" />
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
            color: getContrastingTextColor('white'),
          }}>
          Write your profile answers
        </Text>

        <View style={{marginTop: 20, flexDirection: 'column', gap: 20}}>
          {prompts?.map((item, index) => (
            <Pressable
              onPress={() =>
                navigation.navigate('ShowPrompts', {prompts, index, setPrompts})
              }
              style={{
                borderColor: '#707070',
                borderWidth: 2,
                justifyContent: 'center',
                alignItems: 'center',
                borderStyle: 'dashed',
                borderRadius: 10,
                height: 70,
              }}
              key={index}>
              {item?.question && item?.answer ? (
                <>
                  <Text
                    style={{
                      fontWeight: '600',
                      fontStyle: 'italic',
                      fontSize: 15,
                      textAlign: 'center',
                      color: getContrastingTextColor('white'),
                    }}>
                    {item?.question}
                  </Text>
                  <Text
                    style={{
                      fontWeight: '600',
                      fontStyle: 'italic',
                      fontSize: 15,
                      marginTop: 3,
                      textAlign: 'center',
                      color: getContrastingTextColor('white'),
                    }}>
                    {item?.answer}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      color: 'gray',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      fontSize: 15,
                    }}>
                    Select a Prompt
                  </Text>
                  <Text
                    style={{
                      color: 'gray',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      marginTop: 3,
                      fontSize: 15,
                    }}>
                    And Write your own answer
                  </Text>
                </>
              )}
            </Pressable>
          ))}
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

export default PromptsScreen;

const styles = StyleSheet.create({});
