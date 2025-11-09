import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import Entypo from '@react-native-vector-icons/entypo';
import AntDesign from '@react-native-vector-icons/ant-design';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import ImageCarousel from '../components/ImageCarousel';
import { useNotification } from '../context/NotificationContext';

const HandleLikeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const { clearLikeCount, refreshCounts } = useNotification();
  const onViewProfile = () => {
    const userInfo = route?.params?.userInfo || {
      firstName: route?.params?.name,
      imageUrls: route?.params?.imageUrls,
      prompts: route?.params?.prompts,
    };
    setMenuOpen(false);
    navigation.navigate('ProfileDetail', {userInfo, viewOnly: true});
  };
  const createMatch = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const currentUserId = route?.params?.userId;
      const selectedUserId = route?.params?.selectedUserId;

      const response = await axios.post(
        `${BASE_URL}/create-match`,
        {
          currentUserId,
          selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status == 200) {
        // Immediately clear like badge and refresh counts after acceptance
        clearLikeCount && clearLikeCount();
        refreshCounts && refreshCounts();
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error', error);
    }
  };
  const match = () => {
    Alert.alert('Accept Request?', `Match with ${route?.params?.name}`, [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'OK', onPress: () => createMatch()},
    ]);
  };
  return (
    <>
      <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: 6,
          }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{paddingRight: 6, paddingVertical: 4}}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </Pressable>
          <Text style={{fontSize: 16, fontWeight: '600'}}>
            {route?.params?.likes ? `All ${route?.params?.likes}` : route?.params?.name}
          </Text>
        </View>

        <View style={{marginVertical: 8, paddingHorizontal: 12}}>
          {route?.params?.type == 'prompt' ? (
            <View>
              <Text style={{fontSize: 18, fontWeight: '700'}}>
                {route?.params?.question}
              </Text>
              <Text style={{fontSize: 16, marginTop: 6}}>
                {route?.params?.answer}
              </Text>
            </View>
          ) : (
            <Image
              style={{
                width: '100%',
                height: 140,
                borderRadius: 7,
                resizeMode: 'cover',
              }}
              source={{uri: route?.params?.image}}
            />
          )}
        </View>

        {/* Context chip */}
        <View style={{paddingHorizontal: 12}}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: '#f4f4f4',
              borderRadius: 16,
              marginBottom: 8,
            }}>
            <Text style={{fontSize: 13, color: '#333'}}>
              {route?.params?.comment
                ? route?.params?.comment
                : route?.params?.type === 'prompt'
                ? 'Liked your prompt'
                : 'Liked your photo'}
            </Text>
          </View>
        </View>

        <View style={{marginVertical: 16}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
              <Text style={{fontSize: 20, fontWeight: '700'}}>
                {route?.params?.name}
              </Text>
              <View
                style={{
                  backgroundColor: '#452c63',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 14,
                }}>
                <Text style={{textAlign: 'center', color: 'white'}}>
                  new here
                </Text>
              </View>
            </View>
            <View style={{position: 'relative', zIndex: 2}}>
              <Pressable
                onPress={() => setMenuOpen(prev => !prev)}
                style={{padding: 6}}>
                <Entypo name="dots-three-horizontal" size={22} color="black" />
              </Pressable>
              {menuOpen && (
                <View
                  style={{
                    position: 'absolute',
                    top: 28,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 12,
                    zIndex: 9999,
                    minWidth: 160,
                  }}>
                  <Pressable
                    onPress={onViewProfile}
                    style={{paddingVertical: 10, paddingHorizontal: 12}}>
                    <Text style={{fontSize: 14}}>View Profile</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={{marginVertical: 10, paddingHorizontal: 12}}>
            <View>
              {Array.isArray(route?.params?.imageUrls) && route?.params?.imageUrls?.length > 0 && (
                <View style={{position: 'relative'}}>
                  <ImageCarousel
                    images={route?.params?.imageUrls}
                    height={410}
                    borderRadius={10}
                  />
                </View>
              )}
            </View>

            <View style={{marginVertical: 10}}>
              {route?.params?.prompts.slice(0, 1).map(prompt => (
                <View
                  key={prompt?.id ?? String(prompt?.question ?? '0')}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 10,
                    minHeight: 120,
                    justifyContent: 'center',
                    borderWidth: 0.8,
                    borderColor: '#EDEDED',
                  }}>
                  <Text style={{fontSize: 15, fontWeight: '500'}}>
                    {prompt?.question}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      marginTop: 12,
                    }}>
                    {prompt?.answer}
                  </Text>
                </View>
              ))}
            </View>

            {/* profile details to come here */}

            <View style={{marginVertical: 10}}>
              {route?.params?.prompts.slice(1, 2).map(prompt => (
                <View
                  key={prompt?.id ?? String(prompt?.question ?? '1')}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 10,
                    minHeight: 120,
                    justifyContent: 'center',
                    borderWidth: 0.8,
                    borderColor: '#EDEDED',
                  }}>
                  <Text style={{fontSize: 15, fontWeight: '500'}}>
                    {prompt?.question}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      marginTop: 12,
                    }}>
                    {prompt?.answer}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{marginVertical: 10}}>
              {route?.params?.prompts.slice(2, 3).map(prompt => (
                <View
                  key={prompt?.id ?? String(prompt?.question ?? '2')}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 10,
                    minHeight: 120,
                    justifyContent: 'center',
                    borderWidth: 0.8,
                    borderColor: '#EDEDED',
                  }}>
                  <Text style={{fontSize: 15, fontWeight: '500'}}>
                    {prompt?.question}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      marginTop: 12,
                    }}>
                    {prompt?.answer}
                  </Text>
                </View>
              ))}
            </View>

            {/* additional stacked image blocks removed in favor of modern carousel */}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 35,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}>
        <Pressable
          onPress={match}
          style={{
            backgroundColor: 'white',
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 6,
          }}>
          {/* Single red heart icon */}
          <AntDesign name="heart" size={30} color="#e91e63" />
        </Pressable>
      </View>
    </>
  );
};

export default HandleLikeScreen;

const styles = StyleSheet.create({});
