import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import React, {useContext, useState, useEffect, useCallback} from 'react';
import {AuthContext} from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASE_URL} from '../urls/url';
import LottieView from 'lottie-react-native';
import UserChat from '../components/UserChat';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../utils/theme';

const ChatScreen = () => {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const {userId, setUserId} = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/get-matches/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMatches(response.data.matches);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        setIsLoading(true);
        fetchMatches();
      }
    }, [userId])
  );

  const [categorizedChats, setCategorizedChats] = useState({
    yourTurn: [],
    theirTurn: [],
  });

  const fetchAndCategorizeChats = async () => {
    const yourTurn = [];
    const theirTurn = [];

    await Promise.all(
      matches?.map(async item => {
        try {
          const response = await axios.get(`${BASE_URL}/messages`, {
            params: {senderId: userId, receiverId: item?.userId},
          });

          const messages = response.data;
          const lastMessage = messages[messages.length - 1];

          // Attach lastMessage and categorize
          const enriched = {...item, lastMessage};
          if (lastMessage?.senderId == userId) {
            theirTurn.push(enriched);
          } else {
            yourTurn.push(enriched);
          }
        } catch (error) {
          console.log('Error fetching', error);
        }
      }),
    );
    // Sort both lists by lastMessage timestamp descending (most recent first)
    const sortDesc = arr => arr.sort((a, b) => {
      const at = new Date(b?.lastMessage?.timestamp || 0).getTime();
      const bt = new Date(a?.lastMessage?.timestamp || 0).getTime();
      return at - bt;
    });
    sortDesc(yourTurn);
    sortDesc(theirTurn);
    setCategorizedChats({yourTurn, theirTurn});
  };

  

  useEffect(() => {
    fetchAndCategorizeChats();
  }, [matches]);

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

  console.log('Matches', matches);

  return (
    <ScrollView
      style={{marginTop: 0}}
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: colors.card,
        justifyContent: matches?.length > 0 ? 'flex-start' : 'center',
      }}>
      <View>
        <View style={{marginVertical: 12, marginHorizontal: 15}}>
          {matches?.length > 0 ? (
            <>
              <Text
                style={{fontSize: 22, fontWeight: 'bold', marginVertical: 12, color: colors.text}}>
                Matches
              </Text>

              {matches?.map((item, index) => (
                <UserChat key={index} item={item} userId={userId} />
              ))}
            </>
          ) : (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Image
                style={{width: 100, height: 100}}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/128/5065/5065340.png',
                }}
              />

              <View style={{marginTop: 50}}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: colors.text,
                  }}>
                  No Matches right now
                </Text>
                <Text
                  style={{
                    color: 'gray',
                    marginTop: 10,
                    fontSize: 15,
                    textAlign: 'center',
                  }}>
            Matches are more considered on SouleMate. We can help improve your
                  chances
                </Text>
              </View>

              <View style={{marginTop: 50}} />

              <Pressable
                onPress={() => navigation.navigate('Subscription', { tab: 'soulemateX' })}
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
                onPress={() => navigation.navigate('Subscription', { tab: 'soulemateX' })}
                style={{
                  padding: 12,
                  borderRadius: 22,

                  borderColor: '#E0E0E0',
                  borderWidth: 1,
                  marginTop: 15,
                  width: 250,
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: 15,
                  }}>
          Upgrage to SouleMateX
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({});
