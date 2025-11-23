import {StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, Pressable, ToastAndroid, Alert, Platform, Image} from 'react-native';
import React, {useState, useContext, useMemo} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import BackHeader from '../components/BackHeader';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import { AuthContext } from '../AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';

import { colors } from '../utils/theme';
const EditProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { setUserInfo, userInfo: ctxUserInfo, userId, token } = useContext(AuthContext);
  const userInfo = useMemo(() => route?.params?.userInfo || ctxUserInfo, [route?.params?.userInfo, ctxUserInfo]);

  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [lastName, setLastName] = useState(userInfo?.lastName || '');
  const [jobTitle, setJobTitle] = useState(userInfo?.jobTitle || '');
  const [workPlace, setWorkPlace] = useState(userInfo?.workPlace || '');
  const [location, setLocation] = useState(userInfo?.location || '');
  const [hometown, setHometown] = useState(userInfo?.hometown || '');
  const [lookingFor, setLookingFor] = useState(userInfo?.lookingFor || '');
  const [gender, setGender] = useState(userInfo?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(userInfo?.dateOfBirth || '');
  const [type, setType] = useState(userInfo?.type || '');
  const [datingPreferences, setDatingPreferences] = useState(Array.isArray(userInfo?.datingPreferences) ? userInfo.datingPreferences.join(', ') : '');
  const [images, setImages] = useState(Array.isArray(userInfo?.imageUrls) ? userInfo.imageUrls : []);

  const addImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, selectionLimit: 1 });
      const asset = result?.assets?.[0];
      if (!asset?.base64) return;
      const mime = asset?.type || 'image/jpeg';
      const ext = mime.endsWith('png') ? 'png' : (mime.endsWith('webp') ? 'webp' : 'jpg');
      const uploadResp = await axios.post(`${BASE_URL}/upload-image`, { imageBase64: asset.base64, ext });
      const url = uploadResp?.data?.url;
      if (url) {
        const next = [...images, url];
        setImages(next);
      }
    } catch (e) {
      console.log('Add image error', e?.message);
      Alert.alert('Error', 'Could not add image');
    }
  };

  const removeImageAt = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const onSave = async () => {
    const updatedLocal = {
      ...userInfo,
      firstName,
      lastName,
      jobTitle,
      workPlace,
      location,
      hometown,
      lookingFor,
      gender,
      dateOfBirth,
      type,
      datingPreferences: datingPreferences?.split(',').map(s => s.trim()).filter(Boolean),
      imageUrls: images,
    };
    try {
      if (userId && token) {
        const resp = await axios.patch(`${BASE_URL}/user-info`, {
          userId,
          firstName,
          lastName,
          jobTitle,
          workPlace,
          location,
          hometown,
          lookingFor,
          gender,
          dateOfBirth,
          type,
          datingPreferences: datingPreferences?.split(',').map(s => s.trim()).filter(Boolean),
          imageUrls: images,
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
    <SafeAreaView style={{flex:1, backgroundColor: colors.card}}>
      <BackHeader title="Edit Profile" />
      <ScrollView style={{padding: 16}}>
        <Text style={{fontSize: 18, fontWeight: '600', marginBottom: 12}}>Edit Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="Enter first name" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder="Enter last name" placeholderTextColor="#BEBEBE" />
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <TextInput value={gender} onChangeText={setGender} style={styles.input} placeholder="Male/Female/Other" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type</Text>
          <TextInput value={type} onChangeText={setType} style={styles.input} placeholder="Profile type" placeholderTextColor="#BEBEBE" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dating Preferences</Text>
          <TextInput value={datingPreferences} onChangeText={setDatingPreferences} style={styles.input} placeholder="Comma-separated (e.g., Men, Women)" placeholderTextColor="#BEBEBE" />
        </View>

        <Text style={{fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 8}}>Profile Images</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {images.map((url, idx) => (
            <View key={`${url}-${idx}`} style={{ width: 90 }}>
              <Image source={{ uri: `${BASE_URL}${url}`.startsWith('http') ? url : `${BASE_URL}${url}` }} style={{ width: 90, height: 90, borderRadius: 8 }} />
              <Pressable onPress={() => removeImageAt(idx)} style={{ marginTop: 6, backgroundColor: '#eee', paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ textAlign: 'center', color: '#b00020' }}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addImage} style={{ width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#666' }}>+ Add</Text>
          </Pressable>
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
    backgroundColor: colors.card,
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
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});