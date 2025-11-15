import {StyleSheet, Text, View} from 'react-native';
import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import Entypo from '@react-native-vector-icons/entypo';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import LikesScreen from '../screens/LikesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {NavigationContainer} from '@react-navigation/native';
import { navigationRef } from './RootNavigation';
import LoginScreen from '../screens/LoginScreen';
import BasicInfo from '../screens/BasicInfo';
import NameScreen from '../screens/NameScreen';
import EmailScreen from '../screens/EmailScreen';
import OtpScreen from '../screens/OtpScreen';
import PasswordScreen from '../screens/PasswordScreen';
import DateOfBirthScreen from '../screens/DateOfBirthScreen';
import LocationScreen from '../screens/LocationScreen';
import GenderScreen from '../screens/GenderScreen';
import TypeScreen from '../screens/TypeScreen';
import DatingType from '../screens/DatingType';
import LookingFor from '../screens/LookingFor';
import HomeTownScreen from '../screens/HomeTownScreen';
import WorkPlace from '../screens/WorkPlace';
import JobTitleScreen from '../screens/JobTitleScreen';
import PhotoScreen from '../screens/PhotoScreen';
import PromptsScreen from '../screens/PromptsScreen';
import ShowPromptsScreen from '../screens/ShowPromptsScreen';
import PreFinalScreen from '../screens/PreFinalScreen';
import WritePrompt from '../screens/WritePrompt';
import {AuthContext} from '../AuthContext';
import SendLikeScreen from '../screens/SendLikeScreen';
import HandleLikeScreen from '../screens/HandleLikeScreen';
import ChatRoom from '../screens/ChatRoom';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationBadge from '../components/NotificationBadge';
import { useNotification } from '../context/NotificationContext';
import VideoCallScreen from '../screens/VideoCallScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import FAQScreen from '../screens/FAQScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const StackNavigator = () => {
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();
  const {token} = useContext(AuthContext);
  function BottomTabs() {
    const { messageCount, likeCount, clearMessageCount, clearLikeCount } = useNotification();

    return (
      <Tab.Navigator
        screenOptions={() => ({
          tabBarShowLabel: false,
          tabBarStyle: {height: 90},
        })}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <Ionicons
                  style={{paddingTop: 3}}
                  name="shuffle-outline"
                  size={30}
                  color="white"
                />
              ) : (
                <Ionicons
                  style={{paddingTop: 3}}
                  name="shuffle-outline"
                  size={30}
                  color="#989898"
                />
              ),
          }}
        />

        <Tab.Screen
          name="Likes"
          component={LikesScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            headerShown: false,
            tabBarIcon: ({focused}) => (
              <NotificationBadge count={likeCount}>
                {focused ? (
                  <Entypo
                    style={{paddingTop: 3}}
                    name="heart"
                    size={30}
                    color="white"
                  />
                ) : (
                  <Entypo
                    style={{paddingTop: 3}}
                    name="heart"
                    size={30}
                    color="#989898"
                  />
                )}
              </NotificationBadge>
            ),
          }}
          listeners={{
            tabPress: () => {
              clearLikeCount();
            },
          }}
        />

        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            headerShown: false,
            tabBarIcon: ({focused}) => (
              <NotificationBadge count={messageCount}>
                {focused ? (
                  <MaterialIcons
                    style={{paddingTop: 3}}
                    name="chat-bubble-outline"
                    size={30}
                    color="white"
                  />
                ) : (
                  <MaterialIcons
                    style={{paddingTop: 3}}
                    name="chat-bubble-outline"
                    size={30}
                    color="#989898"
                  />
                )}
              </NotificationBadge>
            ),
          }}
          listeners={{
            tabPress: () => {
              clearMessageCount();
            },
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <Ionicons
                  style={{paddingTop: 3}}
                  name="person-circle-outline"
                  size={28}
                  color="white"
                />
              ) : (
                <Ionicons
                  style={{paddingTop: 3}}
                  name="person-circle-outline"
                  size={28}
                  color="#989898"
                />
              ),
          }}
        />
      </Tab.Navigator>
    );
  }
  const AuthStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Basic"
          component={BasicInfo}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Name"
          component={NameScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Email"
          component={EmailScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Otp"
          component={OtpScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Password"
          component={PasswordScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Birth"
          component={DateOfBirthScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Location"
          component={LocationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Gender"
          component={GenderScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Type"
          component={TypeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Dating"
          component={DatingType}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LookingFor"
          component={LookingFor}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Hometown"
          component={HomeTownScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Workplace"
          component={WorkPlace}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="JobTitle"
          component={JobTitleScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Photos"
          component={PhotoScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Prompts"
          component={PromptsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ShowPrompts"
          component={ShowPromptsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="WritePrompt"
          component={WritePrompt}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PreFinal"
          component={PreFinalScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    );
  };
  function MainStack() {
    return (
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={BottomTabs}
            options={{headerShown: false}}
          />
          {/* Profile edit screens accessible from MainStack chips */}
          <Stack.Screen
            name="Name"
            component={NameScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Location"
            component={LocationScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Hometown"
            component={HomeTownScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Workplace"
            component={WorkPlace}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="JobTitle"
            component={JobTitleScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="LookingFor"
            component={LookingFor}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Photos"
            component={PhotoScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Prompts"
            component={PromptsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="WritePrompt"
            component={WritePrompt}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="SendLike"
            component={SendLikeScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="HandleLike"
            component={HandleLikeScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen name="ChatRoom" component={ChatRoom} />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{headerShown: false}}
          />

          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{headerShown: false}}
          />
            <Stack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{ headerTitle: 'Blocked Users' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FAQ"
            component={FAQScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AboutUs"
            component={AboutUsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
    );
  }
  return (
    <NavigationContainer ref={navigationRef}>
      {token == null || token == '' ? <AuthStack /> : <MainStack />}
    </NavigationContainer>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
