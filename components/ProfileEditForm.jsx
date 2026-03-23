import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef } from 'react';
import {
    ActivityIndicator,
  Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import styles from '../assets/styles/profile.styles';
import COLORS from '../constants/colors';
import { useGetProfileQuery, useUpdateProfileMutation } from '../services/authApi';
import { setUser } from '../store/authSlice';
import CountryPickerModal from './CountryPickerModal';
import { BASE_URL as API_BASE_URL } from '../utils/apiConfig';

export default function ProfileEditForm({ onCancel, onSuccess }) {
  const { data: userData } = useGetProfileQuery();
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const user = userData?.data || userData;
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [country, setCountry] = useState(() => {
    // Initialize country from user data - could be string or object
    if (user?.country) {
      if (typeof user.country === 'string') {
        return { name: user.country };
      }
      return user.country;
    }
    return null;
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const scrollViewRef = useRef(null);
  const FALLBACK_PROFILE_IMAGE_URI = Asset.fromModule(require('../assets/images/icon.png')).uri;

  // Helper function to get proper image source
  const getImageSource = () => {
    const image = profileImage || user?.profileImage;

    if (!image) {
      return { uri: FALLBACK_PROFILE_IMAGE_URI };
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('file://')) {
      return { uri: image };
    }

    const normalizedPath = image.startsWith('/') ? image : `/${image}`;
    return { uri: `${API_BASE_URL}${normalizedPath}` };
  };
  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
      });
      setProfileImage(user?.profileImage || null);
      // Initialize country from user data
      if (user?.country) {
        if (typeof user.country === 'string') {
          setCountry({ name: user.country });
        } else {
          setCountry(user.country);
        }
      } else {
        setCountry(null);
      }
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };


  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const isFormValid = () => {
    return formData.name.trim() && formData.email.trim();
  };

  const handleSubmit = async () => {
    try {
      let updateData;
      
      if (profileImage && profileImage !== user?.profileImage) {
        // Create FormData for image upload
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name.trim());
        formDataToSend.append('email', formData.email.trim());
        formDataToSend.append('phone', formData.phone.trim());
        formDataToSend.append('bio', formData.bio.trim());
        if (country?.name) {
          formDataToSend.append('country', country.name);
        }
        
        if (profileImage.startsWith('file://') || profileImage.startsWith('http')) {
          // For React Native, append the image directly to FormData
          formDataToSend.append('file', {
            uri: profileImage,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });
        }
        
        updateData = { formData: formDataToSend };
      } else {
        // Regular JSON update
        updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          bio: formData.bio.trim(),
        };
        if (country?.name) {
          updateData.country = country.name;
        }
      }

      const result = await updateProfile(updateData).unwrap();
      
      // Check if the update was successful - be more flexible with response format
      const isSuccess = result?.success || result?.status === 1 || result?.status === 200 || 
                       (result?.message && !result?.message?.toLowerCase()?.includes('error'));
      
      if (isSuccess) {
        // Update local state
        dispatch(setUser({
          user: { 
            ...user, 
            ...formData,
            bio: formData.bio.trim(),
            profileImage: profileImage || user?.profileImage,
            country: country?.name || user?.country
          }
        }));
        
        Alert.alert('Success', result?.message || 'Profile updated successfully');
        onSuccess?.();
      } else {
        Alert.alert('Error', result?.message || 'Failed to update profile');
      }
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'Failed to update profile';
      
      if (error?.status === 'FETCH_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const resetForm = () => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
      });
      setProfileImage(user?.profileImage || null);
      // Reset country
      if (user?.country) {
        if (typeof user.country === 'string') {
          setCountry({ name: user.country });
        } else {
          setCountry(user.country);
        }
      } else {
        setCountry(null);
      }
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => onCancel?.()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <Image
              source={getImageSource()}
            style={styles.editProfileImage}
            />
            
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={20} color={COLORS.white} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color={COLORS.white} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <Text style={styles.characterCount}>{formData.name.length}/50</Text>
              </View>
              <TextInput
                style={[styles.textInput, !formData.name.trim() && styles.textInputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textSecondary}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={[styles.textInput, !formData.email.trim() && styles.textInputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(true)}
                style={styles.countryInputContainer}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.countryInputIcon}
                />
                {country ? (
                  <View style={styles.countryDisplay}>
                    {country.flag && (
                      <Image
                        source={{ uri: country.flag }}
                        style={styles.countryFlag}
                        contentFit="contain"
                      />
                    )}
                    <Text style={styles.countryText}>
                      {country.name} {country.code && `(${country.code})`}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.countryPlaceholder}>Select a country</Text>
                )}
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <Text style={[styles.characterCount, formData.bio.length > 450 && styles.characterCountWarning]}>
                  {formData.bio.length}/500
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Tell us about yourself"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, (!isFormValid() || isLoading) && styles.saveButtonDisabled]} 
              onPress={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={(selectedCountry) => {
          setCountry(selectedCountry);
        }}
        selectedCountry={country}
      />
    </View>
  );
}