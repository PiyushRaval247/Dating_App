import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import React, {useState, useContext, useCallback, useEffect} from 'react';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import LottieView from 'lottie-react-native';
import ImageCarousel from '../components/ImageCarousel';

import { colors } from '../utils/theme';
const LikesScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const {userId, userInfo} = useContext(AuthContext);
  const [likes, setLikes] = useState([]);
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchReceivedLikes();
      }
    }, [userId]),
  );
  const fetchReceivedLikes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/received-likes/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const receivedLikes = response.data.receivedLikes;

      setLikes(receivedLikes);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (userId) {
      fetchReceivedLikes();
    }
  }, [userId]);

  // Removed getUserDetails since it's now handled by AuthContext
  // useEffect(() => {
  //   if (userId && !userInfo) {  // Only fetch if userInfo doesn't exist
  //     getUserDetails();
  //   }
  // }, [userId]);

  const screenWidth = Dimensions.get('window').width;
  const profileWidth = (screenWidth - 46) / 2;

  const checkActive = () => {
    if (!userInfo) {
      return;
    }
    return (
      userInfo.subscriptions?.some(item => item.status == 'active') || false
    );
  };

  const activeSubscription = checkActive();
  

  const renderProfile = ({item: like}) => (
    <Pressable
      disabled={!activeSubscription}
      style={{
        width: profileWidth,
        marginVertical: 10,
        backgroundColor: colors.card,
        borderColor: '#E0E0E0',
        borderWidth: 0.5,
        borderRadius: 8,
      }}>
      <View style={{paddingHorizontal: 10, paddingTop: 10}}>
        {like?.comment ? (
          <View
            style={{
              alignItems: 'flex-start',
              backgroundColor: '#fae8e0',
              borderRadius: 5,
              marginBottom: 8,
              alignSelf: 'flex-start',
              maxWidth: profileWidth - 20,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}>
            <Text numberOfLines={1} ellipsizeMode="tail">
              {like?.comment || 'Liked your photo'}
            </Text>
          </View>
        ) : (
          <View
            style={{
              alignItems: 'flex-start',

              paddingVertical: 10,

              borderRadius: 5,
              marginBottom: 8,
              alignSelf: 'flex-start',
            }}>
            <Text style={{fontStyle: 'italic'}}>Liked your photo</Text>
          </View>
        )}

        <Text
          style={{
            fontSize: 17,
            fontWeight: '500',
            marginBottom: 10,
          }}>
          {like?.userId?.firstName}
        </Text>
      </View>

      <View>
        {(() => {
          const imgs = Array.isArray(like?.userId?.imageUrls)
            ? like.userId.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
            : [];
          const first = imgs[0];
          if (!first) return null; // show only if a valid photo exists
          return (
            <Image
              blurRadius={activeSubscription ? 0 : 20}
              style={{
                height: 220,
                width: profileWidth,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
              source={{uri: first}}
            />
          );
        })()}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F8F8',
        }}>
        <LottieView
          source={require('../assets/loading2.json')}
          style={{
            height: 180,
            width: 300,
            alignSelf: 'center',
            marginTop: 40,
            justifyContent: 'center',
          }}
          autoPlay
          loop={true}
          speed={0.7}
        />
      </View>
    );
  }
  console.log('Likes', likes);
  if (likes?.length > 0) {
    const Header = (
      <View style={{padding: 15}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: 23,
              fontWeight: 'bold',
  fontWeight: '700',
              marginTop: 15,
            }}>
            Likes You
          </Text>
          <Pressable
        onPress={() => navigation.navigate('Subscription', {tab: 'soulemateX'})}
            style={{
              backgroundColor: '#008B8B',
              padding: 10,
              borderRadius: 30,
            }}>
            <Text
              style={{
                textAlign: 'center',
                color: colors.white,
                fontWeight: 'bold',
              }}>
              Boost
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={{
            marginTop: 13,
            borderColor: '#E0E0E0',
            borderWidth: 1,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            gap: 6,
            alignItems: 'center',
            paddingVertical: 7,
            paddingHorizontal: 10,
            borderRadius: 24,
          }}>
          <Text style={{color: '#404040', fontWeight: '500'}}>Recent</Text>
          <MaterialDesignIcons name="chevron-down" size={22} color="gray" />
        </Pressable>

        <View style={{marginTop: 15}}>
          <Pressable
            onPress={() =>
              navigation.navigate('HandleLike', {
                name: likes[0].userId?.firstName,
                image: likes[0]?.image,
                imageUrls: likes[0]?.userId.imageUrls,
                prompts: likes[0]?.userId?.prompts,
                userInfo: likes[0]?.userId,
                userId: userId,
                selectedUserId: likes[0].userId?.userId,
                likes: likes.length,
                type: likes[0].type,
                prompt: likes[0]?.prompt,
              })
            }
            style={{
              padding: 10,
              borderColor: '#E0E0E0',
              borderWidth: 2,
              borderRadius: 7,
            }}>
            <View>
              <View
                style={{
                  alignItems: 'flex-start',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#fae8e0',
                  borderRadius: 5,
                  marginBottom: 8,
                  alignSelf: 'flex-start',
                }}>
                <Text numberOfLines={1}>
                  {likes[0].comment
                    ? likes[0].comment
                    : likes[0].type == 'prompt'
                    ? 'Liked your prompt'
                    : likes[0].type == 'image'
                    ? 'Liked your photo'
                    : 'Liked your Content'}
                </Text>
              </View>

              <Text style={{fontSize: 22, fontWeight: 'bold'}}>
                {likes[0].userId?.firstName}
              </Text>
              <View style={{marginTop: 20}}>
                {Array.isArray(likes[0]?.userId?.imageUrls) && likes[0]?.userId?.imageUrls?.filter(u => typeof u === 'string' && u.trim() !== '').length > 0 ? (
                  <ImageCarousel
                    images={likes[0]?.userId?.imageUrls}
                    height={350}
                    borderRadius={10}
                  />
                ) : null}
              </View>
            </View>
          </Pressable>
        </View>

        {likes?.length > 1 && (
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
  fontWeight: '700',
                marginTop: 20,
              }}>
              Up Next
            </Text>
            <Text style={{marginTop: 4, color: '#282828'}}>
              Subscribe to see everyone who likes you
            </Text>
          </View>
        )}

        <View
          style={{
            backgroundColor: '#e0ceed',
            padding: 12,
            flexDirection: 'row',
            borderRadius: 10,
            gap: 10,
            marginTop: 20,
            marginBottom: 5,
            paddingBottom: 15,
          }}>
          <View>
            <Text style={{fontSize: 18, fontWeight: '600', width: 280}}>
              {(() => {
                const total = Array.isArray(likes) ? likes.length : 0;
                const name = likes[1]?.userId?.firstName;
                const others = Math.max(0, total - 2);
                return `Meet ${name ? name + ' and ' : ''}${others} others who like you`;
              })()}
            </Text>
            <Pressable
        onPress={() => navigation.navigate('Subscription', {tab: 'soulemateplus'})}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: '#8446b0',
                marginTop: 10,
                alignSelf: 'flex-start',
                borderRadius: 18,
              }}>
              <Text
                style={{textAlign: 'center', color: colors.white, fontSize: 13}}>
          Get SouleMate +
              </Text>
            </Pressable>
          </View>
          <View style={{position: 'relative'}}>
            <Image
              source={{
                uri: 'https://www.instagram.com/p/C27SU9sNMXO/media/?size=l',
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                position: 'absolute',
                top: 0,
                left: 20,
                transform: [{rotate: '-10deg'}],
                zIndex: 2,
                borderWidth: 2,
                borderColor: colors.white,
              }}
            />

            <Image
              source={{
                uri: 'https://www.instagram.com/p/C1Rzh7KJ0OY/media/?size=l',
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                position: 'absolute',
                top: 40,
                left: 0,
                transform: [{rotate: '10deg'}],
                zIndex: 1,
                borderWidth: 2,
                borderColor: colors.white,
              }}
            />
          </View>
        </View>
      </View>
    );

    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.card}}>
        <FlatList
          data={likes?.slice(1)}
          renderItem={renderProfile}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
          ListHeaderComponent={Header}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
        />
      </SafeAreaView>
    );
  }

  // Empty state (no ScrollView to avoid nesting VirtualizedList)
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.card}}>
      <View
        style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Image
          style={{width: 100, height: 100}}
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/38/38384.png',
          }}
        />

        <View>
          <Text
            style={{fontSize: 22, fontWeight: 'bold', textAlign: 'center'}}>
            You're new, no likes yet
          </Text>

          <Text
            style={{
              color: 'gray',
              marginTop: 10,
              fontSize: 15,
              textAlign: 'center',
            }}>
            We can help you to get your first one sooner
          </Text>
        </View>

        <View style={{marginTop: 50}} />

        <Pressable
        onPress={() => navigation.navigate('Subscription', {tab: 'soulemateX'})}
          style={{
            padding: 12,
            borderRadius: 22,
            backgroundColor: '#0a7064',
            width: 250,
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '500',
              fontSize: 15,
              color: colors.white,
            }}>
            Boost Your Profile
          </Text>
        </Pressable>

        <Pressable
        onPress={() => navigation.navigate('Subscription', {tab: 'soulemateX'})}
          style={{
            padding: 12,
            borderRadius: 22,
            backgroundColor: '#0a7064',
            borderColor: '#E0E0E0',
            borderWidth: 1,
            marginTop: 15,
            width: 250,
          }}>
          <Text
            style={{textAlign: 'center', fontWeight: '500', fontSize: 15}}>
          Upgrage to SouleMateX
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default LikesScreen;

const styles = StyleSheet.create({});
