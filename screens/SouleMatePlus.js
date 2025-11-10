import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ImageBackground,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, {useState,useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASE_URL, RAZORPAY_KEY_ID} from '../urls/url';
import {useNavigation} from '@react-navigation/native';
import { AuthContext } from '../AuthContext';

const SouleMatePlus = () => {
  const plans = [
    {
      id: '0',
      plan: '1 week',
      price: '1650.00/wk',
      name: 'New',
    },
    {
      id: '1',
      plan: '1 month',
      price: '3450.00/wk',
      name: 'Save 51%',
    },
    {
      id: '2',
      plan: '3 months',
      price: '2133.33/wk',
      name: 'Save 70%',
    },
    {
      id: '3',
      plan: '6 months',
      price: '1633.33/wk',
      name: 'Save 77%',
    },
  ];
  const navigation = useNavigation();
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {userId, setUserInfo} = useContext(AuthContext)
  const pay = async () => {
    try {
      setIsLoading(true);

      // Parse price safely: "1650.00/wk" -> 1650.00 rupees -> 165000 paise
      const priceText = String(plan?.price || '');
      const match = priceText.match(/[0-9]+(?:\.[0-9]+)?/);
      const amountRupees = match ? parseFloat(match[0]) : 0;
      let amount = Math.round(amountRupees * 100);
      if (!Number.isFinite(amount) || amount <= 0) {
        console.log('WARN: Invalid amount parsed from', priceText, '-> Fallback to ₹1.00');
        amount = 100; // ₹1.00 in paise
      }

      const options = {
  description: 'SouleMate Plus Subscription',
        currency: 'INR',
  name: 'SouleMate',
        key: RAZORPAY_KEY_ID,
        amount: String(amount),
        prefill: {
          email: 'void@razorpay.com',
          contact: '9191919191',
          name: 'RazorPay Software',
        },
        theme: {color: '#900C3F'},
        retry: {enabled: true, max_count: 1},
      };

      try {
        // Only proceed if Razorpay payment succeeds
        const data = await RazorpayCheckout.open(options);
        console.log('Payment successful:', data);
        
        const token = await AsyncStorage.getItem('token');
  const type = 'SouleMate plus';

        const response = await axios.post(
          `${BASE_URL}/subscribe`,
          {
            userId,
            plan,
            type,
            paymentId: data.razorpay_payment_id, // Include payment ID
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status == 200) {
          // Refresh user info to reflect active subscription immediately
          try {
            const userResp = await axios.get(`${BASE_URL}/user-info`, { params: { userId } });
            if (userResp.status === 200) {
              setUserInfo && setUserInfo(userResp.data.user);
            }
          } catch (e) {
            console.log('Error refreshing user info after subscription', e);
          }
  Alert.alert('Success', 'You have been subscribed to SouleMate Plus', [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {text: 'OK', onPress: () => navigation.goBack()},
          ]);
        } else {
          console.log('Error creating order', response.data);
          Alert.alert('Error', 'Failed to activate subscription. Please contact support.');
        }
      } catch (paymentError) {
        console.log('Payment cancelled or failed', paymentError);
        Alert.alert('Payment Failed', 'Payment was cancelled or failed. Please try again.');
      }
    } catch (error) {
      console.log('Error', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <ScrollView>
        <View
          style={{
            marginTop: 10,
            flex: 1,
            padding: 12,
            backgroundColor: 'white',
          }}>
          <ImageBackground
            resizeMode="cover"
            imageStyle={{borderRadius: 10, marginTop: 10, opacity: 0.9}}
            style={{height: 200, width: '100%'}}
            source={{
              uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSs48AlXs6q_E_rz9UGJDy8wyj6-Mft76F2wHjs2uboOn-TDF-XMfXSeiYNi0L_3sWQFY&usqp=CAU',
            }}>
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: 30,
                  color: 'white',
                  fontWeight: 'bold',
                  width: 200,
                }}>
                See everyone who likes you
              </Text>
            </View>
          </ImageBackground>

          <View style={{marginTop: 25}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plans?.map((item, index) => (
                <Pressable
                  key={item?.id ?? String(index)}
                  onPress={() => setPlan(item)}
                  style={{marginRight: 10}}>
                  <View
                    style={{
                      backgroundColor:
                        plan?.name == item?.name ? '#8e33b5' : '#B0B0B0',
                      padding: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                    }}>
                    <Text
                      style={{
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: '500',
                      }}>
                      {item?.name}
                    </Text>
                  </View>

                  <View
                    style={{
                      padding: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'white',
                      borderColor:
                        plan?.name == item?.name ? '#8e33b5' : '#E0E0E0',
                      borderWidth: 2,
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 10,
                    }}>
                    <Text style={{color: 'gray', fontSize: 15}}>
                      {item?.plan}
                    </Text>

                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '600',
                        marginTop: 8,
                        letterSpacing: 0.6,
                      }}>
                      {item?.price}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={{marginTop: 30}}>
            <View style={{flexDirection: 'row', gap: 14}}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#E0E0E0',
                }}>
                <Ionicons name="infinite-outline" size={22} color="black" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 8,
                  letterSpacing: 0.6,
                }}>
                Send unlimited likes*
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 14, marginVertical: 15}}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#E0E0E0',
                }}>
                <Ionicons name="person-outline" size={22} color="black" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 8,
                  letterSpacing: 0.6,
                }}>
                See everyone who likes you
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 14}}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#E0E0E0',
                }}>
                <Ionicons name="filter-outline" size={22} color="black" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 8,
                  letterSpacing: 0.6,
                }}>
                Set more dating preferences
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 14, marginVertical: 15}}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#E0E0E0',
                }}>
                <Ionicons name="funnel-outline" size={22} color="black" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 8,
                  letterSpacing: 0.6,
                }}>
                Sort all incoming likes
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 14}}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#E0E0E0',
                }}>
                <Ionicons name="search-outline" size={22} color="black" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 8,
                  letterSpacing: 0.6,
                }}>
                Browse by who's new or nearby
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {plan && (
        <Pressable
          onPress={pay}
          style={{
            backgroundColor: '#8e33b5',
            marginTop: 'auto',
            marginBottom: 10,
            padding: 12,
            marginHorizontal: 10,
            borderRadius: 20,
          }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: 0.6,
                color: 'white',
              }}>
              Get {plan?.plan} for {plan?.price}
            </Text>
          )}
        </Pressable>
      )}
    </>
  );
};

export default SouleMatePlus;

const styles = StyleSheet.create({});
