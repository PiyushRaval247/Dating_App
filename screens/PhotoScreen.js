import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
  Alert,
  PermissionsAndroid,
  Linking,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import { colors } from '../utils/theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import EvilIcons from '@react-native-vector-icons/evil-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../utils/registrationUtils';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

const PhotoScreen = () => {
  const [imageUrls, setImageUrls] = useState(['', '', '', '', '', '']);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const navigation = useNavigation();

  // Check if permissions are already granted
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        const storagePermission = Platform.Version >= 33 
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES)
          : await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        
        console.log('Camera permission:', cameraPermission);
        console.log('Storage permission:', storagePermission);
        
        return { camera: cameraPermission, storage: storagePermission };
      } catch (error) {
        console.log('Error checking permissions:', error);
        return { camera: false, storage: false };
      }
    }
    return { camera: true, storage: true };
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Request gallery permission for Android
  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+)
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Gallery Permission',
              message: 'App needs gallery permission to select photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Gallery Permission',
              message: 'App needs gallery permission to select photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  // Open device settings for manual permission grant
  const openAppSettings = () => {
    Alert.alert(
      'Enable Permissions Manually',
      'Please go to Settings > Apps > Your App > Permissions and enable Camera and Storage permissions.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.openSettings();
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Show image picker options
  const showImagePickerOptions = (index) => {
    setSelectedImageIndex(index);
    Alert.alert(
      'Select Image',
      'Choose an option to add your photo',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Enter URL',
          onPress: () => showUrlInput(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  // Open camera
  const openCamera = async () => {
    try {
      console.log('Attempting to open camera...');
      const hasPermission = await requestCameraPermission();
      console.log('Camera permission granted:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take photos. Please enable it in your device settings or use the URL option instead.',
          [
            { text: 'Use URL Instead', onPress: () => showUrlInput() },
            { text: 'Try Again', onPress: () => openCamera() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        saveToPhotos: false,
      };

      launchCamera(options, response => {
        console.log('Camera response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled camera');
          return;
        }
        
        if (response.errorMessage) {
          console.log('Camera error:', response.errorMessage);
          Alert.alert(
            'Camera Error',
            `Error accessing camera: ${response.errorMessage}. Please try using the URL option instead.`,
            [
              { text: 'Use URL Instead', onPress: () => showUrlInput() },
              { text: 'OK' }
            ]
          );
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          console.log('Selected image URI:', imageUri);
          addImageToSlot(imageUri);
        } else {
          Alert.alert('No Photo Taken', 'Please take a photo or use the URL option.');
        }
      });
    } catch (error) {
      console.log('Camera launch error:', error);
      Alert.alert(
        'Camera Error',
        'Failed to open camera. Please try using the URL option instead.',
        [
          { text: 'Use URL Instead', onPress: () => showUrlInput() },
          { text: 'OK' }
        ]
      );
    }
  };

  // Open gallery
  const openGallery = async () => {
    try {
      console.log('Attempting to open gallery...');
      const hasPermission = await requestGalleryPermission();
      console.log('Gallery permission granted:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Gallery permission is needed to select photos. Please enable it in your device settings or use the URL option instead.',
          [
            { text: 'Use URL Instead', onPress: () => showUrlInput() },
            { text: 'Try Again', onPress: () => openGallery() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        selectionLimit: 1,
      };

      launchImageLibrary(options, response => {
        console.log('Gallery response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled gallery selection');
          return;
        }
        
        if (response.errorMessage) {
          console.log('Gallery error:', response.errorMessage);
          Alert.alert(
            'Gallery Error',
            `Error accessing gallery: ${response.errorMessage}. Please try using the URL option instead.`,
            [
              { text: 'Use URL Instead', onPress: () => showUrlInput() },
              { text: 'OK' }
            ]
          );
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          console.log('Selected image URI:', imageUri);
          addImageToSlot(imageUri);
        } else {
          Alert.alert('No Image Selected', 'Please select an image or use the URL option.');
        }
      });
    } catch (error) {
      console.log('Gallery launch error:', error);
      Alert.alert(
        'Gallery Error',
        'Failed to open gallery. Please try using the URL option instead.',
        [
          { text: 'Use URL Instead', onPress: () => showUrlInput() },
          { text: 'OK' }
        ]
      );
    }
  };

  // Show URL input dialog
  const showUrlInput = () => {
    Alert.prompt(
      'Enter Image URL',
      'Please enter the URL of your image',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: (url) => {
            if (url && url.trim()) {
              addImageToSlot(url.trim());
            }
          },
        },
      ],
      'plain-text',
      imageUrl,
    );
  };

  // Add image to selected slot
  const addImageToSlot = (imageUri) => {
    if (selectedImageIndex !== null) {
      const updatedUrls = [...imageUrls];
      updatedUrls[selectedImageIndex] = imageUri;
      setImageUrls(updatedUrls);
      setSelectedImageIndex(null);
    }
  };

  // Remove image from slot
  const removeImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => {
            const updatedUrls = [...imageUrls];
            updatedUrls[index] = '';
            setImageUrls(updatedUrls);
          },
        },
      ],
    );
  };

  const handleAddImage = () => {
    const index = imageUrls?.findIndex(url => url === '');
    if (index !== -1) {
      showImagePickerOptions(index);
    } else {
      Alert.alert('All Slots Full', 'All image slots are filled. Remove an image first to add a new one.');
    }
  };

  useEffect(() => {
    getRegistrationProgress('Photos').then(progressData => {
      if (progressData) {
        // Normalize saved URLs to ensure only non-empty strings are treated as filled
        const normalized = Array.isArray(progressData.imageUrls)
          ? progressData.imageUrls.map(url =>
              typeof url === 'string' ? url : ''
            )
          : ['','','','','',''];
        setImageUrls(normalized);
      }
    });
  }, []);

  const handleNext = () => {
    // Count only non-empty, non-whitespace strings as valid photos
    const filledImages = imageUrls.filter(url => typeof url === 'string' && url.trim() !== '').length;
    if (filledImages < 1) {
      Alert.alert(
        'Add a Photo',
        'Please add at least 1 photo to continue.',
        [{text: 'OK'}]
      );
      return;
    }
    saveRegistrationProgress('Photos', {imageUrls});
    navigation.navigate('Prompts');
  };

  console.log('images', imageUrls);

  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 100, // Extra space for next button
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{marginTop: 80, marginHorizontal: 20}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: 'black',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <MaterialIcons name="photo-camera-back" size={23} color="black" />
            </View>
            <Image
              style={{width: 100, height: 40}}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 25,
              fontWeight: '700',
              marginTop: 15,
              color: colors.text,
            }}>
            Pick your photos and videos
          </Text>

          <View style={{marginTop: 20}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
              {imageUrls?.slice(0, 3).map((url, index) => (
                <Pressable
                  onPress={() => url ? removeImage(index) : showImagePickerOptions(index)}
                  style={{
                    borderColor: '#581845',
                    borderWidth: url ? 0 : 2,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderStyle: 'dashed',
                    borderRadius: 10,
                    height: 100,
                    position: 'relative',
                  }}
                  key={index}>
                  {url ? (
                    <>
                      <Image
                        source={{uri: url}}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          resizeMode: 'cover',
                        }}
                      />
                      <Pressable
                        onPress={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <Ionicons name="close" size={16} color="white" />
                      </Pressable>
                    </>
                  ) : (
                    <View style={{alignItems: 'center'}}>
                      <EvilIcons name="image" size={22} color="black" />
                      <Text style={{fontSize: 12, marginTop: 5, color: '#581845'}}>Tap to add</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{marginTop: 20}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
              {imageUrls?.slice(3, 6).map((url, index) => (
                <Pressable
                  onPress={() => url ? removeImage(index + 3) : showImagePickerOptions(index + 3)}
                  style={{
                    borderColor: '#581845',
                    borderWidth: url ? 0 : 2,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderStyle: 'dashed',
                    borderRadius: 10,
                    height: 100,
                    position: 'relative',
                  }}
                  key={index}>
                  {url ? (
                    <>
                      <Image
                        source={{uri: url}}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          resizeMode: 'cover',
                        }}
                      />
                      <Pressable
                        onPress={() => removeImage(index + 3)}
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <Ionicons name="close" size={16} color="white" />
                      </Pressable>
                    </>
                  ) : (
                    <View style={{alignItems: 'center'}}>
                      <EvilIcons name="image" size={22} color="black" />
                      <Text style={{fontSize: 12, marginTop: 5, color: '#581845'}}>Tap to add</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={{marginVertical: 10}}>
              <Text style={{color: colors.textMuted, fontSize: 15}}>Drag to reorder</Text>
              <Text
                style={{
                  marginTop: 4,
                  color: '#581845',
                  fontWeight: '500',
                  fontSize: 15,
                }}>
                Add one or more photos
              </Text>
            </View>

            <View style={{marginTop: 25}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: colors.text}}>Add photos easily</Text>
              <Text style={{fontSize: 14, color: colors.textMuted, marginTop: 5}}>
                Tap on any empty slot above to add photos, or use the options below:
              </Text>
              
              {/* URL Input Section */}
              <View style={{marginTop: 15}}>
                <Text style={{fontSize: 14, marginBottom: 8, color: colors.text}}>Enter Image URL:</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: 8,
                    backgroundColor: '#DCDCDC',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}>
                  <EvilIcons name="image" size={22} color={colors.text} />
                  <TextInput
                    value={imageUrl}
                    onChangeText={text => setImageUrl(text)}
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 16,
                    }}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor={colors.textSubtle}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (imageUrl.trim()) {
                      const index = imageUrls?.findIndex(url => url === '');
                      if (index !== -1) {
                        setSelectedImageIndex(index);
                        addImageToSlot(imageUrl.trim());
                        setImageUrl('');
                      } else {
                        Alert.alert('All Slots Full', 'All image slots are filled. Remove an image first.');
                      }
                    } else {
                      Alert.alert('Invalid URL', 'Please enter a valid image URL.');
                    }
                  }}
                  style={{
                    backgroundColor: '#581845',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 6,
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <Text style={{color: colors.white, fontSize: 14, fontWeight: '500'}}>
                    Add from URL
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Camera/Gallery Section */}
              <View style={{marginTop: 20}}>
                <Text style={{fontSize: 14, marginBottom: 8, color: colors.text}}>Or choose from device:</Text>
                <Text style={{fontSize: 12, color: colors.textMuted, marginBottom: 10}}>
                  Note: Camera and gallery access requires permissions. If denied, please enable them in Settings.
                </Text>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity
                    onPress={() => {
                      const index = imageUrls?.findIndex(url => url === '');
                      if (index !== -1) {
                        setSelectedImageIndex(index);
                        openCamera();
                      } else {
                        Alert.alert('All Slots Full', 'All image slots are filled. Remove an image first.');
                      }
                    }}
                    style={{
                      backgroundColor: '#4CAF50',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 6,
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <Text style={{color: colors.white, fontSize: 14, fontWeight: '500'}}>
                      📷 Camera
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      const index = imageUrls?.findIndex(url => url === '');
                      if (index !== -1) {
                        setSelectedImageIndex(index);
                        openGallery();
                      } else {
                        Alert.alert('All Slots Full', 'All image slots are filled. Remove an image first.');
                      }
                    }}
                    style={{
                      backgroundColor: '#2196F3',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 6,
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <Text style={{color: colors.white, fontSize: 14, fontWeight: '500'}}>
                      🖼️ Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  onPress={openAppSettings}
                  style={{
                    backgroundColor: '#FF9800',
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 6,
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <Text style={{color: colors.white, fontSize: 12}}>
                    ⚙️ Having permission issues? Open Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Fixed Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          backgroundColor: '#581845',
          borderRadius: 30,
          padding: 8,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}>
        <Ionicons
          name="chevron-forward-circle-outline"
          size={45}
          color="white"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PhotoScreen;

const styles = StyleSheet.create({});