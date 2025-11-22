import {
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import {AuthContext} from '../AuthContext';
import 'core-js/stable/atob';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import Ionicons from '@react-native-vector-icons/ionicons';
import Entypo from '@react-native-vector-icons/entypo';
import LottieView from 'lottie-react-native';
 import ImageCarousel from '../components/ImageCarousel';
 import { getAgeFromDob } from '../utils/dateUtils';
 import { colors } from '../utils/theme';

const HomeScreen = () => {
  const navigation = useNavigation();
  const {userId, setUserId, token, setToken, userInfo, setUserInfo} =
    useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(users[0]);
  const [option, setOption] = useState('Age');
  const [isAnimating, setIsAnimating] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [dislikedProfiles, setDislikedProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const animationValue = new Animated.Value(0);
  const scale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const initialize = async () => {
      if (userId) {
        try {
          await fetchMatches();
        } catch (error) {
          console.log('Error getting data', error);
        }
      }
    };

    initialize();
  }, [userId]);

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

  // Store rejected/hidden profiles as a map: { [userId]: expiryIso }
  const saveRejectedMap = async map => {
    try {
      await AsyncStorage.setItem('rejectedProfiles', JSON.stringify(map));
    } catch (error) {
      console.log('Error saving rejected map', error);
    }
  };

  const loadRejectedMap = async () => {
    try {
      const data = await AsyncStorage.getItem('rejectedProfiles');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.log('Error loading rejected map', error);
      return {};
    }
  };

  const handleDislike = async () => {
    setProfileVisible(prev => !prev);

    setIsAnimating(true);

    Animated.timing(animationValue, {
      toValue: 1,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      animationValue.setValue(0);
      setIsAnimating(false);
      setProfileVisible(true);
    });

    if (!currentProfile) return;

    // Mark profile hidden for 24 hours
    try {
      const map = await loadRejectedMap();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      map[currentProfile.userId] = expiry;
      await saveRejectedMap(map);
    } catch (e) {
      console.log('Error saving rejected profile', e);
    }

    const remainingUsers = users.slice(1);
    setUsers(remainingUsers);
    setCurrentProfile(remainingUsers.length > 0 ? remainingUsers[0] : null);
  };

  // Periodically clear expired hidden entries and refresh matches when needed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        const map = await loadRejectedMap();
        let changed = false;
        for (const [uid, iso] of Object.entries(map)) {
          if (!iso) { delete map[uid]; changed = true; continue; }
          const t = Date.parse(iso);
          if (!isFinite(t) || now > t) {
            delete map[uid];
            changed = true;
          }
        }
        if (changed) {
          await saveRejectedMap(map);
          // Refresh server matches so reintroduced profiles appear
          fetchMatches();
        }
      } catch (e) {
        console.log('Error cleaning rejected map', e);
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
    };

    fetchUser();
  }, []);

  // useEffect(() => {
  //   if (userId) {
  //     fetchMatches();
  //   }
  // }, [userId]);

  useEffect(() => {
    if (users.length > 0) {
      setCurrentProfile(users[0]);
    }
  }, [users]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchMatches();
      }
    }, [userId]),
  );

  const fetchMatches = async () => {
    try {
      const rejectedMap = await loadRejectedMap();
      const now = Date.now();

      const response = await axios.get(
        `${BASE_URL}/matches?userId=${encodeURIComponent(userId)}`,
      );

      const matches = response.data.matches || [];

      const filteredMatches = matches.filter(match => {
        const iso = rejectedMap[match.userId];
        if (!iso) return true;
        const t = Date.parse(iso);
        if (!isFinite(t)) return true;
        return now > t; // only include if expiry passed
      });

      setUsers(filteredMatches);
    } catch (error) {
      console.log('Error', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // console.log('matches', currentProfile?.type || 'No current profile');
  const logout = () => {
    clearAuthToken();
  };
  const clearAuthToken = async () => {
    try {
      await AsyncStorage.removeItem('token');

      setToken('');
    } catch (error) {
      console.log('Error', error);
    }
  };

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

  if (!isLoading && users.length == 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F8F8',
        }}>
        <Text>No Profiles found</Text>
      </View>
    );
  }

  console.log('info', userInfo);
  return (
    <>
      <ScrollView contentContainerStyle={{flexGrow: 1, marginTop: 0}}>
        <View
          style={{
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
          <Pressable
            onPress={logout}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#D0D0D0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Ionicons name="sparkles-sharp" size={22} color="black" />
          </Pressable>

          <Pressable
            onPress={() => setOption('Age')}
            style={{
              borderColor: option == 'Age' ? 'transparent' : '#808080',
              borderWidth: 0.7,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: option == 'Age' ? 'black' : 'transparent',
            }}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '400',
                color: option == 'Age' ? 'white' : '#808080',
              }}>
              Age
            </Text>
          </Pressable>

          <Pressable
            style={{
              borderColor: option == 'Height' ? 'transparent' : '#808080',
              borderWidth: 0.7,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: option == 'Height' ? 'black' : 'transparent',
            }}
            onPress={() => setOption('Height')}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '400',
                color: option == 'Height' ? 'white' : '#808080',
              }}>
              Height
            </Text>
          </Pressable>

          <Pressable
            style={{
              borderColor:
                option == 'Dating Intention' ? 'transparent' : '#808080',
              borderWidth: 0.7,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                option == 'Dating Intention' ? 'black' : 'transparent',
            }}
            onPress={() => setOption('Dating Intention')}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '400',
                color: option == 'Dating Intention' ? 'white' : '#808080',
              }}>
              Dating Intention
            </Text>
          </Pressable>

          <Pressable
            style={{
              borderColor: option == 'Nearby' ? 'transparent' : '#808080',
              borderWidth: 0.7,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: option == 'Nearby' ? 'black' : 'transparent',
            }}
            onPress={() => setOption('Nearby')}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '400',
                color: option == 'Nearby' ? 'white' : '#808080',
              }}>
              Nearby
            </Text>
          </Pressable>
        </View>

        {profileVisible && (
          <View style={{marginHorizontal: 12, marginVertical: 12}}>
            <>
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Text style={{fontSize: 22, fontWeight: 'bold', color: colors.text}}>
                      {currentProfile?.firstName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: '#452c63',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}>
                      <Text style={{textAlign: 'center', color: 'white'}}>
                        new here
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Entypo
                      name="dots-three-horizontal"
                      size={22}
                      color="black"
                    />
                  </View>
                </View>

                <View style={{marginVertical: 15}}>
                  {Array.isArray(currentProfile?.imageUrls) && currentProfile?.imageUrls.length > 0 && (
                    <View style={{position: 'relative'}}>
                      <ImageCarousel
                        images={currentProfile?.imageUrls}
                        height={410}
                        borderRadius={10}
                        onIndexChange={setCarouselIndex}
                      />
                      {/* Top info card overlay */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          right: 12,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                          <Text style={{fontSize: 20, fontWeight: '700', color: colors.text}}>
                            {(() => {
                              const name = currentProfile?.firstName || '';
                              const age = getAgeFromDob(currentProfile?.dateOfBirth);
                              return age != null ? `${name}, ${age}` : name;
                            })()}
                          </Text>
                          <View
                            style={{
                              backgroundColor: '#452c63',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 20,
                            }}>
                            <Text style={{color: 'white', fontSize: 12}}>new here</Text>
                          </View>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                          {currentProfile?.location ? (
                            <Text style={{fontSize: 12, color: '#333'}}>{currentProfile.location}</Text>
                          ) : currentProfile?.hometown ? (
                            <Text style={{fontSize: 12, color: '#333'}}>{currentProfile.hometown}</Text>
                          ) : null}
                        </View>
                      </View>
                      {/* Bottom info card overlay */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          left: 12,
                          right: 80,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                          <Text style={{fontSize: 14, color: '#000', fontWeight: '600'}}>
                            {currentProfile?.jobTitle ? currentProfile.jobTitle : currentProfile?.type || 'Profile'}
                          </Text>
                          {currentProfile?.workPlace ? (
                            <Text style={{fontSize: 12, color: '#555'}}>{currentProfile.workPlace}</Text>
                          ) : null}
                        </View>
                        {currentProfile?.lookingFor ? (
                          <Text style={{fontSize: 12, color: '#555', marginTop: 4}}>
                            Looking for: {currentProfile.lookingFor}
                          </Text>
                        ) : null}
                      </View>
                      {/* Like button overlay */}
                      <Pressable
                        onPress={() => {
                          const imgs = (currentProfile?.imageUrls || []).filter(u => typeof u === 'string' && u.trim() !== '');
                          const img = imgs[carouselIndex] || imgs[0];
                          if (!img) return;
                          navigation.navigate('SendLike', {
                            type: 'image',
                            image: img,
                            name: currentProfile?.firstName,
                            userId: userId,
                            likedUserId: currentProfile?.userId,
                          });
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          backgroundColor: 'white',
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: '#000',
                          shadowOffset: {width: 0, height: 2},
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 5,
                        }}>
                        <Image
                          style={{width: 30, height: 30, resizeMode: 'contain'}}
                          source={{
                            uri: 'https://cdn-icons-png.flaticon.com/128/2724/2724657.png',
                          }}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>

                <View style={{marginVertical: 15}}>
                  {currentProfile?.prompts?.slice(0, 1).map((prompt, index) => (
                    <>
                      <View
                        style={{
                          backgroundColor: colors.card,
                          padding: 12,
                          borderRadius: 10,
                          height: 150,
                          justifyContent: 'center',
                          borderColor: colors.border,
                          borderWidth: 1,
                        }}>
                        <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>
                          {prompt.question}
                        </Text>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: '600',
                            marginTop: 20,
                            lineHeight: 30,
                            color: colors.text,
                          }}>
                          {prompt.answer}
                        </Text>
                      </View>

                      
                    </>
                  ))}
                </View>

                <View style={{marginVertical: 15}}>
                  {currentProfile?.prompts?.slice(1, 2).map(prompt => (
                    <>
                      <View
                        style={{
                          backgroundColor: colors.card,
                          padding: 12,
                          borderRadius: 10,
                          height: 150,
                          justifyContent: 'center',
                          borderColor: colors.border,
                          borderWidth: 1,
                        }}>
                        <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>
                          {prompt.question}
                        </Text>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: '600',
                            marginTop: 20,
                            lineHeight: 30,
                            color: colors.text,
                          }}>
                          {prompt.answer}
                        </Text>
                      </View>

                      
                    </>
                  ))}
                </View>

                {/* additional stacked image blocks removed in favor of modern carousel */}

                <View style={{marginVertical: 15}}>
                  {currentProfile?.prompts?.slice(2, 3).map(prompt => (
                    <>
                      <View
                        style={{
                          backgroundColor: colors.card,
                          padding: 12,
                          borderRadius: 10,
                          height: 150,
                          justifyContent: 'center',
                          borderColor: colors.border,
                          borderWidth: 1,
                        }}>
                        <Text style={{fontSize: 15, fontWeight: '500', color: colors.text}}>
                          {prompt.question}
                        </Text>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: '600',
                            marginTop: 20,
                            lineHeight: 30,
                            color: colors.text,
                          }}>
                          {prompt.answer}
                        </Text>
                      </View>

                      
                    </>
                  ))}
                </View>

                {/* additional stacked image blocks removed in favor of modern carousel */}
              </View>
            </>
          </View>
        )}

        {isAnimating && (
          <Animated.View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{scale}],
            }}>
            <Image
              style={{width: 70, height: 60}}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/17876/17876989.png',
              }}
            />
          </Animated.View>
        )}
      </ScrollView>

      <Pressable
        onPress={handleDislike}
        style={{
          position: 'absolute',
          bottom: 15,
          left: 12,
          backgroundColor: 'white',
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        }}>
        <Image
          style={{width: 30, height: 30, resizeMode: 'contain'}}
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/17876/17876989.png',
          }}
        />
      </Pressable>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
