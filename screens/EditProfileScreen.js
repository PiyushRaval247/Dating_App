import {StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, Pressable, ToastAndroid, Alert, Platform} from 'react-native';
import React, {useState, useContext, useMemo} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import BackHeader from '../components/BackHeader';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import { AuthContext } from '../AuthContext';

const EditProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { setUserInfo, userInfo: ctxUserInfo, userId, token } = useContext(AuthContext);
  const userInfo = useMemo(() => route?.params?.userInfo || ctxUserInfo, [route?.params?.userInfo, ctxUserInfo]);

  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [jobTitle, setJobTitle] = useState(userInfo?.jobTitle || '');
  const [workPlace, setWorkPlace] = useState(userInfo?.workPlace || '');
  const [location, setLocation] = useState(userInfo?.location || '');
  const [hometown, setHometown] = useState(userInfo?.hometown || '');
  const [lookingFor, setLookingFor] = useState(userInfo?.lookingFor || '');

  const onSave = async () => {
    const updatedLocal = {
      ...userInfo,
      firstName,
      jobTitle,
      workPlace,
      location,
      hometown,
      lookingFor,
    };
    try {
      if (userId && token) {
        const resp = await axios.patch(`${BASE_URL}/user-info`, {
          userId,
          firstName,
          jobTitle,
          workPlace,
          location,
          hometown,
          lookingFor,
        }, { headers: { Authorization: `Bearer ${token}` } });
        const updated = resp?.data?.user || updatedLocal;
        setUserInfo && setUserInfo(updated);
      } else {
        setUserInfo && setUserInfo(updatedLocal);
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Profile updated', ToastAndroid.SHORT);
      } else {
        Alert.alert('Saved', 'Profile updated');
      }
      navigation.goBack();
    } catch (error) {
      setUserInfo && setUserInfo(updatedLocal);
      const msg = error?.response?.data?.message || error?.message || 'Failed to save changes';
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'white'}}>
      <BackHeader title="Edit Profile" />
      <ScrollView style={{padding: 16}}>
        <Text style={{fontSize: 18, fontWeight: '600', marginBottom: 12}}>Edit Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="Enter first name" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title</Text>
          <TextInput value={jobTitle} onChangeText={setJobTitle} style={styles.input} placeholder="Enter job title" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work Place</Text>
          <TextInput value={workPlace} onChangeText={setWorkPlace} style={styles.input} placeholder="Enter work place" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Enter location" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hometown</Text>
          <TextInput value={hometown} onChangeText={setHometown} style={styles.input} placeholder="Enter hometown" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Looking For</Text>
          <TextInput value={lookingFor} onChangeText={setLookingFor} style={styles.input} placeholder="What are you looking for?" placeholderTextColor="#BEBEBE" />
        </View>

        <Pressable onPress={onSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#800080',
    marginBottom: 6,
  },
  input: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 0.6,
    color: '#000',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#581845',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});