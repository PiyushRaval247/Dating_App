import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Image,
  Alert,
  ToastAndroid,
  Platform,
  Dimensions,
  Share,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useContext, useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import Feather from '@react-native-vector-icons/feather';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import {AuthContext} from '../AuthContext';
import {TabBar, TabView} from 'react-native-tab-view';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import { getDaysLeft } from '../utils/dateUtils';
import {BASE_URL} from '../urls/url';
import {BottomModal} from 'react-native-modals';
import {SlideAnimation} from 'react-native-modals';
import {ModalContent} from 'react-native-modals';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '../urls/url';
import { colors, spacing, radii } from '../utils/theme';

const ProfileScreen = () => {
  const {token, userId, userInfo, setUserInfo, setToken, setAuthUser, setUserId} = useContext(AuthContext);

  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  // Settings now opens as a full screen; remove modal state
  const getProfileCompleteness = () => {
    const info = userInfo || {};
    const imageCount = Array.isArray(info?.imageUrls) ? (info?.imageUrls?.length || 0) : 0;
    const promptCount = Array.isArray(info?.prompts) ? (info?.prompts?.length || 0) : 0;

    const items = [
      { ok: !!info?.firstName, label: 'Name', route: 'Name' },
      { ok: !!info?.jobTitle, label: 'Job Title', route: 'JobTitle' },
      { ok: !!info?.workPlace, label: 'Workplace', route: 'Workplace' },
      { ok: !!info?.location, label: 'Location', route: 'Location' },
      { ok: !!info?.hometown, label: 'Hometown', route: 'Hometown' },
      { ok: !!info?.lookingFor, label: 'Looking For', route: 'LookingFor' },
      { ok: imageCount >= 3, label: 'Add Photos', route: 'Photos' },
      { ok: promptCount >= 2, label: 'Write Prompts', route: 'Prompts' },
    ];

    const done = items.filter(i => i.ok).length;
    const total = items.length;
    const percent = Math.round((done / total) * 100);
    const missingItems = items.filter(i => !i.ok).map(i => ({ label: i.label, route: i.route }));
    return { percent, done, total, missingItems };
  };

  const roses = [
    {
      id: '0',
      plan: '3 Roses',
      price: '283.33 each',
    },
    {
      id: '0',
      plan: '12 Roses',
      price: '283.33 each',
    },
    {
      id: '0',
      plan: '50 Roses',
      price: '283.33 each',
    },
  ];

  useEffect(() => {
    // Reset loading flags when userInfo changes
    if (userInfo && !hasLoaded) {
      setHasLoaded(true);
      setIsLoading(false);
    }
  }, [userInfo]); // Only react to userInfo changes from AuthContext

  const [routes] = useState([
    {key: 'getMore', title: 'Get More'},
    {key: 'safety', title: 'Safety'},
  {key: 'myHinge', title: 'My SouleMate'},
  ]);

  const [index, setIndex] = useState(0);

  const clearAuthToken = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken('');
      setAuthUser && setAuthUser(null);
      setUserId && setUserId('');
      setUserInfo && setUserInfo(null);
      Alert.alert('Logged out', 'You have been signed out.');
    } catch (error) {
      console.log('Error during logout', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User not loaded');
        return;
      }
      const authToken = token || (await AsyncStorage.getItem('token'));
      const response = await axios.post(
        `${BASE_URL}/activity/check-in`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const { streakCount } = response.data || {};
      // Refresh user info to reflect new streak
      try {
        const userResp = await axios.get(`${BASE_URL}/user-info`, { params: { userId } });
        if (userResp.status === 200) {
          setUserInfo && setUserInfo(userResp.data.user);
        }
      } catch (e) {
        console.log('Error refreshing user info after check-in', e);
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show(`Streak updated: ${streakCount || ''}`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Check-in complete', `Streak: ${streakCount || 'updated'}`);
      }
    } catch (error) {
      console.log('Check-in error', error?.response?.data || error?.message);
      Alert.alert('Error', 'Could not complete check-in');
    }
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const renderScene = ({route}) => {
    switch (route.key) {
      case 'getMore':
        return (
          <GetMore
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
          />
        );
      case 'safety':
        return <Safety />;
      case 'myHinge':
        return <MyHinge />;
      default:
        return null;
    }
  };

  const initiatePayment = async (selectedItem) => {
    try {
      console.log('=== PAYMENT DEBUG START ===');
      const effectivePlan = selectedItem || plan;
      console.log('Plan:', effectivePlan);
      console.log('RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID);
      
      if (!effectivePlan || !effectivePlan.price) {
        console.log('ERROR: Invalid plan or price');
        Alert.alert('Error', 'Please select a valid plan');
        return;
      }

      if (!RAZORPAY_KEY_ID) {
        console.log('ERROR: Razorpay Key ID is missing');
        Alert.alert('Error', 'Razorpay configuration is missing');
        return;
      }

      setIsLoading(true);

      // Robust amount parsing: extract numeric (with decimals), convert to paise, fallback to ₹1.00
      const priceText = String(effectivePlan?.price || '');
      const match = priceText.match(/[0-9]+(?:\.[0-9]+)?/);
      const amountRupees = match ? parseFloat(match[0]) : 0;
      let amount = Math.round(amountRupees * 100);
      if (!Number.isFinite(amount) || amount <= 0) {
        console.log('WARN: Invalid amount parsed from', priceText, '-> Fallback to ₹1.00');
        amount = 100; // ₹1.00 in paise
      }
      console.log('Calculated amount (paise):', amount);

      const options = {
        description: 'Adding To Wallet',
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

      console.log('Razorpay options:', options);
      console.log('About to open Razorpay checkout...');

      try {
        // Only proceed if Razorpay payment succeeds
        const data = await RazorpayCheckout.open(options);
        console.log('Payment successful! Data:', data);
        
        // Payment successful, now update backend
        const rosesToAdd = effectivePlan?.plan.split(' ')[0];

        const response = await axios.post(`${BASE_URL}/payment-success`, {
          userId,
          rosesToAdd,
          paymentId: data.razorpay_payment_id, // Include payment ID for verification
        });

        if (response.status == 200) {
          setModalVisible(false);
          const rosesToAddCount = parseInt(rosesToAdd, 10) || 0;

          // Optimistically update local roses count for immediate UI feedback
          setUserInfo(prev => ({
            ...(prev || {}),
            roses: ((prev?.roses || 0) + rosesToAddCount),
          }));

          // Show toast on Android, alert on iOS
          if (Platform.OS === 'android') {
            ToastAndroid.show(`${rosesToAddCount} roses added to your account`, ToastAndroid.LONG);
          } else {
            Alert.alert('Success', `${rosesToAddCount} roses added to your account!`);
          }

          console.log('Order created successfully!');

          // Refresh user info from server to ensure consistency
          try {
            const userResp = await axios.get(`${BASE_URL}/user-info`, {
              params: {userId},
            });
            if (userResp.status === 200) {
              setUserInfo(userResp.data.user);
            }
          } catch (e) {
            console.log('Error refreshing user info after payment', e);
          }
        }
      } catch (error) {
        console.log('Razorpay error details:', error);
        console.log('Error code:', error.code);
        console.log('Error description:', error.description);
        
        if (error.code === 'payment_cancelled') {
          Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        } else if (error.code === 'payment_failed') {
          Alert.alert('Payment Failed', 'Payment failed. Please try again.');
        } else {
          Alert.alert('Payment Error', `Error: ${error.description || 'Something went wrong with the payment'}`);
        }
        return; // Don't proceed with backend call if payment failed
      }
    } catch (error) {
      console.log('General error:', error);
      console.log('Error stack:', error.stack);
      Alert.alert('Error', `Something went wrong: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      console.log('=== PAYMENT DEBUG END ===');
    }
  };

  const pay = async item => {
    setPlan(item);

    Alert.alert('Buy Roses', `Buying ${item?.plan?.split(' ')[0]} roses`, [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'OK', onPress: () => initiatePayment(item)},
    ]);
  };

  console.log("plan,",plan)

  const getActiveSubscription = () => {
    if (!userInfo || !userInfo.subscriptions) {
      return {isActive: false, planType: null, planName: null, startDate: null, endDate: null, daysLeft: null};
    }

    const active = userInfo.subscriptions.find(item => item.status === 'active');
    if (!active) {
      return {isActive: false, planType: null, planName: null, startDate: null, endDate: null, daysLeft: null};
    }

    const daysLeft = active.endDate ? getDaysLeft(active.endDate) : null;

    return {
      isActive: true,
      planType: active.plan, // 'Hinge plus' or 'Hinge X'
      planName: active.planName, // e.g. '1 month'
      startDate: active.startDate || null,
      endDate: active.endDate || null,
      daysLeft,
    };
  };

  const {isActive, planType, planName, endDate, daysLeft} = getActiveSubscription();

  const planDisplay = (() => {
  if (/soulemate\s*x/i.test(String(planType))) {
  return {label: 'SouleMateX', bg: '#181818', fg: '#FFD700', border: '#FFD700'};
    }
  if (/soulemate\s*plus/i.test(String(planType))) {
  return {label: 'SouleMate+', bg: '#9f4ec2', fg: '#FFFFFF', border: '#9f4ec2'};
    }
    return {label: null, bg: 'purple', fg: '#FFFFFF', border: 'purple'};
  })();

  const GetMore = ({modalVisible, setModalVisible}) => (
    <ScrollView contentContainerStyle={{paddingBottom: 120}}>
      <View style={{flex: 1, marginTop: 30, marginHorizontal: 20}}>
      {/* Removed promotional hero image per request */}

      {/* Boost Explainer Card */}
      <View
        style={{
          marginVertical: 12,
          padding: 14,
          borderRadius: 10,
          backgroundColor: 'white',
          borderColor: '#E0E0E0',
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <View
          style={{
            height: 44,
            width: 44,
            borderRadius: 22,
            backgroundColor: '#800080',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <MaterialDesignIcons name="rocket-launch-outline" size={22} color="white" />
        </View>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 16, fontWeight: '600', color: colors.text}}>Boost</Text>
          <Text style={{color: '#282828', marginTop: 4}}>
            Get seen by more people for a limited time.
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Subscription')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: '#800080',
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Try Boost</Text>
        </Pressable>
      </View>

      {/* Streak Tracker */}
      <View
        style={{
          marginVertical: 12,
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
          borderColor: '#E0E0E0',
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <View
          style={{
            height: 44,
            width: 44,
            borderRadius: 22,
            backgroundColor: '#ff8c00',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <MaterialDesignIcons name="fire" size={22} color="white" />
        </View>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 16, fontWeight: '600', color: colors.text}}>Keep your streak</Text>
          <Text style={{color: '#282828', marginTop: 4}}>
            Engage today to build momentum. Send a like or a message.
          </Text>
        </View>
        <Pressable
          onPress={handleCheckIn}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: '#ff8c00',
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Let’s Go</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderColor: '#E0E0E0',
          borderWidth: 1,
          padding: 10,
          borderRadius: 10,
          backgroundColor: 'white',
        }}>
        <View
          style={{
            height: 40,
            width: 40,
            borderRadius: 20,
            backgroundColor: '#d4abde',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Ionicons name="rose-outline" size={22} color="white" />
        </View>
        <Pressable onPress={() => setModalVisible(!modalVisible)}>
          <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>Roses</Text>
          <Text style={{color: '#282828', marginTop: 3}}>
            2x as likely to lead to a date
          </Text>
          <Text style={{color: '#800080', marginTop: 6, fontWeight: '600'}}>
            Available: {userInfo?.roses ?? 5}
          </Text>
        </Pressable>
      </View>

      
      </View>
    </ScrollView>
  );

  const Safety = () => (
    <ScrollView contentContainerStyle={{paddingBottom: 120}}>
      <View style={{marginTop: 10, marginHorizontal: 20, flex: 1}}>
        <View
          style={{
            marginVertical: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'white',
          }}>
          <View
            style={{
              height: 50,
              width: 50,
              borderRadius: 25,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialDesignIcons
              name="check-decagram-outline"
              size={22}
              color="black"
            />
          </View>

          <View>
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>
              Selfie Verification
            </Text>
            <Text style={{color: '#282828', marginTop: 3}}>
              Your not verified yet
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'white',
          }}>
          <View
            style={{
              height: 50,
              width: 50,
              borderRadius: 25,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Feather name="eye-off" size={22} color="black" />
          </View>
          <View>
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>Hidden words</Text>
            <Text style={{color: '#282828', marginTop: 3}}>
              Hide likes with offensive words
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'white',
            marginVertical: 20,
          }}>
          <View
            style={{
              height: 50,
              width: 50,
              borderRadius: 25,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Feather name="lock" size={22} color="black" />
          </View>
          <View>
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>Block List</Text>
            <Text style={{color: '#282828', marginTop: 3}}>
              Block People you know
            </Text>
          </View>
        </View>

        <Text style={{fontSize: 20, fontWeight: '500', color: colors.text}}>
          Explore safety resources
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginVertical: 12,
          }}>
          <View
            style={{
              padding: 14,
              borderRadius: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderColor: '#E0E0E0',
              borderWidth: 0.7,
              backgroundColor: 'white',
              flex: 1,
            }}>
            <MaterialDesignIcons name="phone-outline" size={22} color="black" />
            <Text style={{fontSize: 17, fontWeight: '500', color: colors.text}}>
              Crisis Hotlines
            </Text>
          </View>

          <View
            style={{
              padding: 14,
              borderRadius: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderColor: '#E0E0E0',
              borderWidth: 0.7,
              backgroundColor: 'white',
              flex: 1,
            }}>
            <MaterialDesignIcons name="help-box" size={22} color="black" />
            <Text style={{color: colors.text}}>Help Center</Text>
          </View>
        </View>

        <View
          style={{
            padding: 12,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 15,
            backgroundColor: 'white',
            borderColor: '#E0E0E0',
            borderWidth: 0.7,
            borderRadius: 8,
          }}>
          <Image
            style={{width: 100, height: 100, borderRadius: 50}}
            source={{
              uri: 'https://images.hinge.co/6e7d61055e6f7783f84a1e41bc85aa3807f9ddba-1200x1094.jpg?w=1200&q=75',
            }}
          />
          <Text style={{textAlign: 'center', fontSize: 19, fontWeight: 'bold', color: colors.text}}>
            Safe Dating Advice
          </Text>

          <Text style={{textAlign: 'center', color: '#282828', fontSize: 15}}>
            Our guide for how to stay safe without loosing the momentum
          </Text>
        </View>

        {/* Safety Tip of the Day */}
        {(() => {
          const tips = [
            'Meet in public places for first dates.',
            'Share your live location with a trusted friend.',
            'Trust your instincts and pause conversations if uneasy.',
            'Avoid sharing sensitive info until you feel safe.',
            'Report and block any suspicious behavior quickly.',
          ];
          const tipIndex = new Date().getDate() % tips.length;
          const tip = tips[tipIndex];
          return (
            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 8,
                backgroundColor: 'white',
                borderColor: '#E0E0E0',
                borderWidth: 0.8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0a7064"
              />
              <Text style={{flex: 1, fontSize: 14, color: '#333'}}>{tip}</Text>
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );

  const MyHinge = () => (
    <ScrollView contentContainerStyle={{paddingBottom: 120}}>
      <View style={{marginTop: 10, marginHorizontal: 20, flex: 1}}>
        {isActive && (
          <View
            style={{
              marginVertical: 12,
              flexDirection: 'column',
              gap: 8,
              borderColor: '#E0E0E0',
              borderWidth: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'white',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Ionicons name="medal-outline" size={22} color={planDisplay.border} />
              <Text style={{fontSize: 16, fontWeight: '700'}}>Active Plan</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: planDisplay.bg,
              }}>
                <Text style={{color: planDisplay.fg, fontWeight: 'bold'}}>{planDisplay.label}</Text>
              </View>
              <Text style={{fontSize: 14, color: '#282828'}}>• {planName}</Text>
            </View>
            {endDate && (
              <Text style={{fontSize: 13, color: '#606060'}}>Ends on {new Date(endDate).toLocaleDateString()} {typeof daysLeft === 'number' ? `(~${daysLeft} days)` : ''}</Text>
            )}
            <Pressable onPress={() => navigation.navigate('Subscription')} style={{
              marginTop: 8,
              borderColor: planDisplay.border,
              borderWidth: 1,
              paddingVertical: 8,
              borderRadius: 18,
              alignSelf: 'flex-start',
              paddingHorizontal: 14,
            }}>
              <Text style={{color: planDisplay.border, fontWeight: '600'}}>Manage Subscription</Text>
            </Pressable>
          </View>
        )}

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 10,
          }}>
          <Pressable
            onPress={() => {
              try {
                Share.share({
  message: 'Check out SouleMate! Find real connections.',
                });
              } catch (e) {}
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'white',
              borderColor: '#E0E0E0',
              borderWidth: 0.7,
              alignItems: 'center',
              gap: 6,
            }}>
            <Ionicons name="share-social-outline" size={20} color="#111" />
            <Text style={{fontWeight: '600', color: colors.text}}>Share App</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Linking.openURL(
  'mailto:support@soulemate.example?subject=Help%20with%20SouleMate&body=Describe%20your%20issue%20here',
              );
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'white',
              borderColor: '#E0E0E0',
              borderWidth: 0.7,
              alignItems: 'center',
              gap: 6,
            }}>
            <Ionicons name="mail-outline" size={20} color="#111" />
            <Text style={{fontWeight: '600', color: colors.text}}>Contact Support</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
  const pkg = Platform.OS === 'android' ? 'com.soulemate.clone' : 'id000000';
              const androidUrl = `market://details?id=${pkg}`;
              const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
              try {
                await Linking.openURL(androidUrl);
              } catch (e) {
                Linking.openURL(webUrl);
              }
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'white',
              borderColor: '#E0E0E0',
              borderWidth: 0.7,
              alignItems: 'center',
              gap: 6,
            }}>
            <Ionicons name="star-outline" size={20} color="#111" />
          <Text style={{fontWeight: '600', color: colors.text}}>Rate App</Text>
        </Pressable>
      </View>

      {/* Achievements Badges */}
      <View
        style={{
          marginVertical: 12,
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
          borderColor: '#E0E0E0',
          borderWidth: 1,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Ionicons name="trophy-outline" size={20} color="#111" />
          <Text style={{fontSize: 16, fontWeight: '600', color: colors.text}}>Achievements</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 10, paddingVertical: 12}}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderColor: '#E0E0E0',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fafafa',
            }}>
            <Ionicons name="images-outline" size={16} color="#800080" />
            <Text style={{fontWeight: '600', color: colors.text}}>Photos Added</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderColor: '#E0E0E0',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fafafa',
            }}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0a7064" />
            <Text style={{fontWeight: '600', color: colors.text}}>First Conversation</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderColor: '#E0E0E0',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fafafa',
            }}>
            <Ionicons name="rose-outline" size={16} color="#d4abde" />
            <Text style={{fontWeight: '600', color: colors.text}}>Rose Sent</Text>
          </View>
        </ScrollView>
      </View>
        <View
          style={{
            marginVertical: 20,

            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderColor: '#E0E0E0',
            borderWidth: 1,
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'white',
          }}>
          <View
            style={{
              height: 50,
              width: 50,
              borderRadius: 25,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialDesignIcons name="help" size={22} color="black" />
          </View>
          <View>
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>Help Center</Text>
            <Text style={{color: '#282828', marginTop: 3}}>
              Safety, Security and more
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderColor: '#E0E0E0',
            borderWidth: 1,
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'white',
          }}>
          <View
            style={{
              height: 50,
              width: 50,
              borderRadius: 25,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialDesignIcons
              name="alarm-light-outline"
              size={22}
              color="black"
            />
          </View>
          <View>
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.text}}>What works</Text>
            <Text style={{color: '#282828', marginTop: 3}}>
              Check out our expert dating tips
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 12,
            marginVertical: 12,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 15,
            backgroundColor: 'white',
            borderColor: '#E0E0E0',
            borderWidth: 0.7,
            borderRadius: 7,
          }}>
          <Image
            style={{width: 100, height: 100, borderRadius: 50}}
            source={{
              uri: 'https://images.hinge.co/6e7d61055e6f7783f84a1e41bc85aa3807f9ddba-1200x1094.jpg?w=1200&q=75',
            }}
          />

          <Text style={{textAlign: 'center', fontSize: 19, fontWeight: 'bold', color: colors.text}}>
            Try a fresh photo
          </Text>

          <Text style={{textAlign: 'center', color: '#282828', fontSize: 15}}>
            Show people your latest and greatest by adding a new photo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
  return (
    <>
      <SafeAreaView style={{flex: 1, backgroundColor: '#F8F8F8'}}>
        <View
          style={{
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View>
            <Text style={{fontSize: 26, fontWeight: '700', color: colors.text}}>
              SOULEMATE
            </Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Pressable onPress={openSettings}>
              <Ionicons name="settings-outline" size={28} color="#111" />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            marginVertical: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Pressable
            onPress={() =>
              navigation.navigate('ProfileDetail', {
                userInfo: userInfo,
              })
            }>
            {(() => {
              const images = Array.isArray(userInfo?.imageUrls)
                ? userInfo.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
                : [];
              const avatar = images[0];
              const commonStyle = {
                width: 100,
                height: 100,
                borderRadius: 50,
                borderColor: planDisplay.border,
                borderWidth: 3,
              };
              if (avatar) {
                return (
                  <Image
                    style={{...commonStyle, resizeMode: 'cover'}}
                    source={{uri: avatar}}
                  />
                );
              }
              return (
                <View style={{...commonStyle, backgroundColor: '#eee'}} />
              );
            })()}
          </Pressable>

          <Text style={{marginTop: 10, fontSize: 24, fontWeight: '500', color: colors.text}}>
            {(() => {
              const name = userInfo?.firstName || '';
              // dateOfBirth may be stored as DD/MM/YYYY or ISO
              try {
                const { getAgeFromDob } = require('../utils/dateUtils');
                const age = getAgeFromDob(userInfo?.dateOfBirth);
                return age != null ? `${name}, ${age}` : name;
              } catch (e) {
                return name;
              }
            })()}
          </Text>

          {isActive && planDisplay.label && (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 25,
                backgroundColor: planDisplay.bg,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 10,
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  color: planDisplay.fg,
                  fontWeight: 'bold',
                }}>
                {planDisplay.label} · {planName}
                {typeof daysLeft === 'number' ? ` · ${daysLeft}d left` : ''}
              </Text>
            </View>
          )}

        <View
          style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: 'white',
            borderColor: '#E0E0E0',
            borderWidth: 1,
          }}>
          <Ionicons name="rose-outline" size={18} color="#800080" />
          <Text style={{color: '#800080', fontWeight: '600'}}>
            Roses: {userInfo?.roses ?? 5}
          </Text>
        </View>

        {/* Profile completeness banner with missing item chips */}
        {(() => {
          const { percent, missingItems } = getProfileCompleteness();
          const showBanner = percent < 100;
          if (!showBanner) return null;
          return (
            <View style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'white',
              borderColor: '#E0E0E0',
              borderWidth: 1,
              width: '85%',
              alignSelf: 'center',
            }}>
              <Text style={{fontSize: 14, fontWeight: '600', marginBottom: 8}}>Complete your profile</Text>
              <View style={{height: 8, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden'}}>
                <View style={{width: `${percent}%`, height: '100%', backgroundColor: '#5b0d63'}} />
              </View>
              <Text style={{fontSize: 12, color: '#555', marginTop: 6}}>{percent}% complete · Add photos and prompts</Text>
              {Array.isArray(missingItems) && missingItems.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingVertical: 10}}>
                  {missingItems.map(item => (
                    <Pressable
                      key={item.label}
                      onPress={() => navigation.navigate(item.route, { fromProfile: true })}
                      style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderColor: '#E0E0E0', borderWidth: 1, backgroundColor: '#fafafa'}}>
                      <Text style={{fontWeight: '600'}}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <Pressable
                onPress={() => navigation.navigate('EditProfile', {userInfo})}
                style={{marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#662d91'}}>
                <Text style={{color: 'white', fontWeight: '600'}}>Update Profile</Text>
              </Pressable>
            </View>
          );
        })()}
        </View>

        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: Dimensions.get('window').width}}
          style={{flex: 1}}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{backgroundColor: 'black'}}
              style={{backgroundColor: '#F8F8F8'}}
              labelStyle={{fontWeight: 'bold'}}
              activeColor="black"
              inactiveColor="gray"
            />
          )}
        />
      </SafeAreaView>

      <BottomModal
        swipeDirection={['up', 'down']}
        swipeThreshold={200}
        modalAnimation={
          new SlideAnimation({
            slideFrom: 'bottom',
          })
        }
        visible={modalVisible}
        onTouchOutside={() => setModalVisible(!modalVisible)}
        onHardwareBackPress={() => setModalVisible(!modalVisible)}>
        <ModalContent style={{width: '100%', height: 'auto'}}>
          <View>
            <Text
              style={{fontSize: 26, fontWeight: 'bold', textAlign: 'center'}}>
              Catch their eye by sending a rose
            </Text>
            <Text
              style={{marginTop: 8, textAlign: 'center', fontSize: 14, color: '#800080', fontWeight: '600'}}>
              You currently have {userInfo?.roses ?? 5} roses
            </Text>
            <Text
              style={{
                marginTop: 16,
                textAlign: 'center',
                fontSize: 15,
                color: '#181818',
                lineHeight: 22,
              }}>
              Roses are always seen first and are twice as likely to lead to a
              date. A purchased rose never expires
            </Text>

            <ScrollView
              contentContainerStyle={{marginTop: 30, marginBottom: 30}}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {roses?.map((item, index) => (
                <Pressable
                  style={{
                    padding: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: '#E0E0E0',
                    borderWidth: 0.6,
                    marginRight: 20,
                    borderRadius: 12,
                    width: 200,
                  }}
                  key={index}>
                  <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                    {item?.plan}
                  </Text>

                  <Image
                    style={{width: 60, height: 60, marginVertical: 15}}
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/128/4006/4006798.png',
                    }}
                  />

                  <Text style={{fontSize: 15, fontWeight: '500'}}>
                    ₹ {item?.price}
                  </Text>

                  <Pressable
                    onPress={() => pay(item)}
                    style={{
                      backgroundColor: '#800080',
                      padding: 12,
                      borderRadius: 22,
                      marginTop: 10,
                      width: 110,
                    }}>
                    <Text style={{textAlign: 'center', color: 'white'}}>
                      Select
                    </Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ModalContent>
      </BottomModal>

      {/* Settings modal removed; using full-screen SettingsScreen now */}
    </>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({});