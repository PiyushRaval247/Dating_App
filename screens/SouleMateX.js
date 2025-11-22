import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ImageBackground,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import React, {useState, useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {AuthContext} from '../AuthContext';
import {useNavigation} from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL, RAZORPAY_KEY_ID } from '../urls/url';
import { colors } from '../utils/theme';

const SouleMateX = () => {
  const planss = [
    {
      id: '0',
      plan: '1 week',
      price: '1199.00/wk',
      name: 'New',
    },
    {
      id: '1',
      plan: '1 month',
      price: '2499.00/wk',
      name: 'Save 51%',
    },
    {
      id: '2',
      plan: '3 months',
      price: '1666.33/wk',
      name: 'Save 70%',
    },
    {
      id: '3',
      plan: '6 months',
      price: '1933.33/wk',
      name: 'Save 77%',
    },
  ];
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {userId, setUserInfo} = useContext(AuthContext);
  const navigation = useNavigation();

  const pay = async () => {
    if (!plan) return;
    try {
      setIsLoading(true);
      const priceText = String(plan?.price || '0');
      const match = priceText.match(/[0-9]+(?:\.[0-9]+)?/);
      const amountRupees = match ? parseFloat(match[0]) : 1;
      const amount = Math.max(100, Math.round(amountRupees * 100));

      const options = {
        description: 'SouleMate X Subscription',
        currency: 'INR',
        name: 'SouleMate',
        key: RAZORPAY_KEY_ID,
        amount: String(amount),
        prefill: { email: 'void@razorpay.com', contact: '9191919191', name: 'SouleMate' },
        theme: { color: colors.primary },
      };

      const data = await RazorpayCheckout.open(options);
      // Notify backend (best-effort)
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(`${BASE_URL}/subscribe`, { userId, plan, type: 'SouleMate X', paymentId: data.razorpay_payment_id }, { headers: { Authorization: `Bearer ${token}` } });
        const userResp = await axios.get(`${BASE_URL}/user-info`, { params: { userId } });
        if (userResp?.data?.user) setUserInfo && setUserInfo(userResp.data.user);
      } catch (e) {
        // ignore backend errors here
      }
      Alert.alert('Success', 'You have been subscribed to SouleMate X', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      console.log('Payment error', e);
      Alert.alert('Payment Failed', 'Payment was cancelled or failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ScrollView>
      <View style={{flex: 1, backgroundColor: '#181818', padding: 12}}>
        <ImageBackground
          style={{width: '100%', height: 200, borderRadius: 10, overflow: 'hidden'}}
          imageStyle={{borderRadius: 10, opacity: 0.9}}
          source={{ uri: 'https://images.pexels.com/photos/6265422/pexels-photo-6265422.jpeg?auto=compress&cs=tinysrgb&w=800' }}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 28, color: colors.white, fontWeight: '700', textAlign: 'center', width: 300}}>Get noticed sooner and go on more dates</Text>
          </View>
        </ImageBackground>

        <View style={{marginTop: 20}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {planss.map((p, i) => (
              <Pressable key={p.id} onPress={() => setPlan(p)} style={{marginRight: 12}}>
                <View style={{backgroundColor: p.name === plan?.name ? colors.card : '#484848', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center'}}>
                  <Text style={{color: p.name === plan?.name ? colors.text : colors.white, fontWeight: '600'}}>{p.name}</Text>
                </View>
                <View style={{backgroundColor: '#101010', padding: 12, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: p.name === plan?.name ? colors.card : '#484848', alignItems: 'center'}}>
                  <Text style={{color: '#D8D8D8'}}>{p.plan}</Text>
                  <Text style={{color: colors.white, fontSize: 16, fontWeight: '700', marginTop: 6}}>{p.price}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{marginTop: 24}}>
          <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
            <View style={{width: 70, height: 70, borderRadius: 35, backgroundColor: '#333'}} />
            <View style={{flex: 1}}>
              <Text style={{color: colors.white, fontSize: 16, fontWeight: '600'}}>Skip the line</Text>
              <Text style={{color: colors.textSubtle, marginTop: 6}}>Get recommended to matches sooner</Text>
            </View>
          </View>

          <View style={{height: 1, backgroundColor: colors.border, marginVertical: 18}} />

          <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
            <View style={{width: 42, height: 42, borderRadius: 21, backgroundColor: '#484848', alignItems: 'center', justifyContent: 'center'}}>
              <Ionicons name="infinite-outline" size={20} color={colors.white} />
            </View>
            <Text style={{color: colors.white, fontWeight: '600'}}>Send unlimited likes*</Text>
          </View>

          <View style={{height: 1, backgroundColor: colors.border, marginVertical: 18}} />

          <Text style={{color: colors.white, textAlign: 'center', fontSize: 18, fontWeight: '700', marginTop: 8}}>Includes SouleMate+ benefits</Text>
        </View>

        {plan && (
          <View style={{padding: 12, marginTop: 18}}>
            <Pressable onPress={pay} style={{backgroundColor: colors.card, padding: 14, borderRadius: 18, alignItems: 'center'}}>
              <Text style={{color: colors.text, fontWeight: '600'}}>Get {plan?.plan} for {plan?.price}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SouleMateX;

const styles = StyleSheet.create({});
