import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import styles from '../assets/styles/profile.styles';
import COLORS from '../constants/colors';
import { useGetProfileQuery, useUpdateProfileMutation } from '../services/authApi';
import { setUser } from '../store/authSlice';

export default function ProfileImagePicker({ onImageUpdate }) {
  const { data: user } = useGetProfileQuery();
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select images. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => ImagePicker.openSettingsAsync() }
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        if (selectedImage.uri) {
          await uploadProfileImage(selectedImage.uri);
        } else {
          Alert.alert('Error', 'No image URI found in selection');
        }
      } else if (result.canceled) {
        // Image selection was canceled
      } else {
        Alert.alert('Error', 'No image was selected');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', `Failed to pick image: ${error.message || 'Unknown error'}`);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.openSettingsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        if (capturedImage.uri) {
          await uploadProfileImage(capturedImage.uri);
        } else {
          Alert.alert('Error', 'No image URI found in captured photo');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', `Failed to take photo: ${error.message || 'Unknown error'}`);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      // Create FormData for image upload with all user fields
      const formData = new FormData();
      formData.append('name', user?.name || '');
      formData.append('email', user?.email || '');
      formData.append('phone', user?.phone || '');
      formData.append('bio', user?.bio || '');
      
      // Handle different URI formats
      if (imageUri.startsWith('file://') || imageUri.startsWith('http')) {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      } else {
        Alert.alert('Error', 'Invalid image format');
        return;
      }

      const result = await updateProfile({ formData }).unwrap();
      
      // Check backend response format
      if (result.status === 1) {
        // Update local state
        dispatch(setUser({
          user: { ...user, profileImage: imageUri }
        }));
        
        if (onImageUpdate) {
          onImageUpdate(imageUri);
        }
        
        Alert.alert('Success', result.message || 'Profile image updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile image');
      }
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'Failed to update profile image';
      
      if (error?.status === 'FETCH_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.profileImageContainer}>
      <TouchableOpacity onPress={showImageOptions} disabled={isLoading}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={
              user?.profileImage && 
              typeof user?.profileImage === 'string' && 
              user?.profileImage.trim() !== '' &&
              (user?.profileImage.startsWith('http://') || user?.profileImage.startsWith('https://') || user?.profileImage.startsWith('file://'))
                ? { uri: user.profileImage }
                : require('../assets/images/icon.png')
            }
            style={styles.profileImage}
            placeholder={require('../assets/images/icon.png')}
            contentFit="cover"
          />
          
          {isLoading && (
            <View style={styles.imageLoadingOverlay}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
            </View>
          )}
          
          <View style={styles.imageEditOverlay}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </View>
        </View>
      </TouchableOpacity>
      
      <Text style={styles.imageEditHint}>Tap to change photo</Text>
    </View>
  );
}

