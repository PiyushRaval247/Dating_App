import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  TextInput,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import React, {useState, useEffect, useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import LottieView from 'lottie-react-native';
import {AuthContext} from '../AuthContext';
import {extractNumber} from '../utils/dynamoUtils';
import BackHeader from '../components/BackHeader';

const SendLikeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [comment, setComment] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [rose, setRose] = useState(false);
  const [profile, setProfile] = useState(true);
  const animationValue = new Animated.Value(0);
  const scale = useState(new Animated.Value(1))[0];
  const {userInfo} = useContext(AuthContext);
  const likeProfile = async () => {
    setProfileVisible(prev => !prev);

    setIsAnimating(true);

    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      animationValue.setValue(0);
      setIsAnimating(false);
      setProfileVisible(true);
    });
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        userId: route?.params?.userId,
        likedUserId: route?.params?.likedUserId,
        image: route?.params?.image,
        prompt: route?.params?.prompt,
        type: route?.params?.type,
      };

      if (comment && comment.trim() !== '') {
        payload.comment = comment.trim();
      }

      const response = await axios.post(`${BASE_URL}/like-profile`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('response', response);
      if (response.status == 200) {
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error', error);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [isAnimating]);

  useEffect(() => {
    if (rose) {
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [rose]);

  const send = async () => {
    setProfile(prev => !prev);

    setRose(true);

    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      animationValue.setValue(0);
      setRose(false);
      setProfile(true);
    });

    try {
      const token = await AsyncStorage.getItem('token');

      const payload = {
        userId: route?.params?.userId,
        likedUserId: route?.params?.likedUserId,
        image: route?.params?.image,
        comment: comment && comment.trim() !== '' ? comment.trim() : null,
        type: route?.params?.type,
      };

      const response = await axios.post(`${BASE_URL}/send-rose`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status == 200) {
        console.log('Rose sent successfully', response.data);
        navigation.goBack();
      }
    } catch (error) {
      if (error.response && error.response.status == 403) {
        navigation.navigate('Subscribe');
      } else {
        console.log('Error', error);
      }
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'rgba(240,240,240,1)'}}>
      <BackHeader title={route?.params?.name || 'Send Like'} />
      {profileVisible && (
        <View
          style={{
            marginTop: 'auto',
            marginBottom: 'auto',
            marginHorizontal: 25,
          }}>
          <Text style={{fontSize: 22, fontWeight: 'bold'}}>
            {route?.params?.name}
          </Text>

          {route?.params?.type == 'image' ? (
            <View
              style={{
                width: '100%',
                height: 350,
                borderRadius: 10,
                marginTop: 20,
                overflow: 'hidden',
                backgroundColor: 'white',
              }}>
              {profile && (
                <Image
                  style={{width: '100%', height: '100%', resizeMode: 'cover'}}
                  source={{uri: route?.params?.image}}
                />
              )}
              {rose && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{scale}],
                  }}>
                  <LottieView
                    source={require('../assets/rose.json')}
                    autoPlay
                    loop={true}
                    speed={0.7}
                    style={{
                      height: 300,
                      width: 300,
                      alignSelf: 'center',
                      marginTop: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  />
                </Animated.View>
              )}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.2,
                shadowRadius: 5,
                width: '100%',
                justifyContent: 'center',
                marginTop: 10,
                height: 200,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#333',
                  textAlign: 'left',
                  marginBottom: 10,
                }}>
                {route?.params?.prompt?.question}
              </Text>
              <Text
                numberOfLines={3}
                style={{fontSize: 22, fontWeight: 'bold', textAlign: 'left'}}>
                {route?.params?.prompt?.answer}
              </Text>
            </View>
          )}

          <TextInput
            placeholder="Add a comment"
            value={comment}
            onChangeText={text => setComment(text)}
            style={{
              padding: 15,
              backgroundColor: 'white',
              borderRadius: 8,
              marginTop: 14,
              fontSize: comment ? 17 : 17,
              color: '#000',
            }}
            placeholderTextColor={'#BEBEBE'}
          />

          <View
            style={{
              marginVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            <Pressable
              onPress={send}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ead8f0',
                borderRadius: 30,
                paddingHorizontal: 25,
                paddingVertical: 20,
                gap: 4,
              }}>
              <Text style={{fontSize: 15, fontWeight: 'bold'}}>
                {extractNumber(userInfo?.roses, 0)}
              </Text>
              <Ionicons name="rose" size={22} color="#a04aba" />
            </Pressable>

            <Pressable
              onPress={likeProfile}
              style={{
                backgroundColor: '#d4badb',
                borderRadius: 30,
                padding: 20,
                flex: 1,
              }}>
              <Text
                style={{textAlign: 'center', fontWeight: 'bold', fontSize: 15}}>
                Send Like
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {isAnimating && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(240, 240, 240, 1)', // Optional overlay effect
          }}>
          <Animated.View
            style={{
              transform: [{scale}],
            }}>
            <Image
              style={{width: 70, height: 60}}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/2724/2724657.png',
              }}
            />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default SendLikeScreen;

const styles = StyleSheet.create({});
