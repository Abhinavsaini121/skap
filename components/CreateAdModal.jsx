import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../assets/styles/createAd.styles";
import COLORS from "../constants/colors";
import { useCreateAdvertisementMutation } from "../services/advertisementApi";
import { useGetActivePlanQuery } from "../services/authApi";
import DatePickerModal from "./DatePickerModal";
import MultiCountryPickerModal from "./MultiCountryPickerModal";

export default function CreateAdModal({ visible, onClose, onSuccess }) {
  const [adType, setAdType] = useState("banner");
  const [advertisementDescription, setAdvertisementDescription] = useState("");
  const [videoUri, setVideoUri] = useState(null);
  const [bannerUris, setBannerUris] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUri, setCompanyLogoUri] = useState(null);
  const [link, setLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  const [createAdvertisement, { isLoading }] = useCreateAdvertisementMutation();

  const { data: activePlan, isLoading: isLoadingPlan } = useGetActivePlanQuery(undefined, {
    skip: !visible,
  });

  const planStartDate = activePlan?.planStartDate ? new Date(activePlan.planStartDate) : null;
  const planEndDate = activePlan?.planEndDate ? new Date(activePlan.planEndDate) : null;
  const hasActivePlan = activePlan?.isActive && planStartDate && planEndDate;

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  // Handle date selection
  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setShowStartDatePicker(false);
  };

  const handleEndDateSelect = (date) => {
    setEndDate(date);
    setShowEndDatePicker(false);
  };

  // Request media library permissions
  const requestMediaPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need media library permission to select files");
        return false;
      }
    }
    return true;
  };

  // Pick video
  const pickVideo = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 120,
      });

      if (!result?.canceled && result?.assets && result?.assets?.length > 0) {
        setVideoUri(result?.assets?.[0]?.uri);
        if (errors.video) {
          setErrors({ ...errors, video: null });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video");
    }
  };

  // Pick banner images (multiple)
  const pickBanners = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result?.canceled && result?.assets && result?.assets?.length > 0) {
        const newUris = result?.assets?.map(asset => asset?.uri);
        setBannerUris([...bannerUris, ...newUris]);
        if (errors.banners) {
          setErrors({ ...errors, banners: null });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick images");
    }
  };

  // Remove banner image
  const removeBanner = (index) => {
    setBannerUris(bannerUris.filter((_, i) => i !== index));
  };

  // Pick company logo
  const pickCompanyLogo = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result?.canceled && result?.assets && result?.assets?.length > 0) {
        setCompanyLogoUri(result?.assets?.[0]?.uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick logo");
    }
  };

  // Reset form
  const resetForm = () => {
    setAdType("banner");
    setAdvertisementDescription("");
    setVideoUri(null);
    setBannerUris([]);
    setCompanyName("");
    setCompanyLogoUri(null);
    setLink("");
    setLinkTitle("");
    setStartDate(null);
    setEndDate(null);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setErrors({});
    setSelectedCountries([]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (adType === "video" && !videoUri) {
      newErrors.video = "Video is required for video ad type";
    }

    if (adType === "banner" && bannerUris.length === 0) {
      newErrors.banners = "At least one banner image is required for banner ad type";
    }

    if (adType === "both") {
      if (!videoUri) {
        newErrors.video = "Video is required for 'both' ad type";
      }
      if (bannerUris.length === 0) {
        newErrors.banners = "At least one banner image is required for 'both' ad type";
      }
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (hasActivePlan) {
      if (startDate && planStartDate && startDate < planStartDate) {
        newErrors.startDate = `Start date must be on or after plan start (${formatDate(planStartDate)})`;
      }
      if (startDate && planEndDate && startDate > planEndDate) {
        newErrors.startDate = `Start date must be before plan end (${formatDate(planEndDate)})`;
      }
      if (endDate && planEndDate && endDate > planEndDate) {
        newErrors.endDate = `End date must be before plan end (${formatDate(planEndDate)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const formData = new FormData();

      // Append text fields
      formData.append("adType", adType);
      formData.append("advertisementDescription", advertisementDescription || "");
      formData.append("companyName", companyName.trim());
      formData.append("link", link || "");
      formData.append("linkTitle", linkTitle || "");
      
      // Append dates
      if (startDate) {
        formData.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        formData.append("endDate", endDate.toISOString());
      }

      // Append allowed countries as string array
      if (selectedCountries.length > 0) {
        selectedCountries.forEach((country) => {
          formData.append("allowedCountry", country.name);
        });
      }

      // Append video if exists (field name must be "file" to match backend)
      if (videoUri && (adType === "video" || adType === "both")) {
        const uriParts = videoUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append("file", {
          uri: videoUri,
          name: `ad-video-${Date.now()}.${fileType}`,
          type: `video/${fileType}`,
        });
      }

      // Append banner images if exists (field name must be "banner" to match backend)
      if (bannerUris.length > 0 && (adType === "banner" || adType === "both")) {
        bannerUris.forEach((uri, index) => {
          const uriParts = uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formData.append("banner", {
            uri: uri,
            name: `ad-banner-${Date.now()}-${index}.${fileType}`,
            type: `image/${fileType}`,
          });
        });
      }

      // Append company logo if exists
      if (companyLogoUri) {
        const uriParts = companyLogoUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append("companyLogo", {
          uri: companyLogoUri,
          name: `company-logo-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const result = await createAdvertisement(formData).unwrap();
      
      Alert.alert("Success", "Advertisement created successfully!");
      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Create ad error:", error);
      Alert.alert(
        "Error",
        error?.data?.message || error?.message || "Failed to create advertisement"
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Advertisement</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ad Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ad Type *</Text>
            <View style={styles.adTypeContainer}>
              <TouchableOpacity
                style={[styles.adTypeButton, adType === "banner" && styles.adTypeButtonActive]}
                onPress={() => setAdType("banner")}
              >
                <Ionicons 
                  name={adType === "banner" ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={adType === "banner" ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.adTypeText, adType === "banner" && styles.adTypeTextActive]}>
                  Banner
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adTypeButton, adType === "video" && styles.adTypeButtonActive]}
                onPress={() => setAdType("video")}
              >
                <Ionicons 
                  name={adType === "video" ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={adType === "video" ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.adTypeText, adType === "video" && styles.adTypeTextActive]}>
                  Video
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adTypeButton, adType === "both" && styles.adTypeButtonActive]}
                onPress={() => setAdType("both")}
              >
                <Ionicons 
                  name={adType === "both" ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={adType === "both" ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.adTypeText, adType === "both" && styles.adTypeTextActive]}>
                  Both
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Company Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={[styles.input, errors.companyName && styles.inputError]}
              placeholder="Enter company name"
              placeholderTextColor={COLORS.placeholderText}
              value={companyName}
              onChangeText={(text) => {
                setCompanyName(text);
                if (errors.companyName) {
                  setErrors({ ...errors, companyName: null });
                }
              }}
              maxLength={200}
            />
            {errors.companyName && (
              <Text style={styles.errorText}>{errors.companyName}</Text>
            )}
          </View>

          {/* Company Logo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Logo</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickCompanyLogo}>
              {companyLogoUri ? (
                <Image source={{ uri: companyLogoUri }} style={styles.logoPreview} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={styles.placeholderText}>Tap to select logo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Video (if video or both) */}
          {(adType === "video" || adType === "both") && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Video *</Text>
              <TouchableOpacity 
                style={[styles.imagePicker, errors.video && styles.imagePickerError]} 
                onPress={pickVideo}
              >
                {videoUri ? (
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="videocam-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select video</Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.video && (
                <Text style={styles.errorText}>{errors.video}</Text>
              )}
            </View>
          )}

          {/* Banner Images (if banner or both) */}
          {(adType === "banner" || adType === "both") && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Banner Images *</Text>
              <TouchableOpacity style={styles.addButton} onPress={pickBanners}>
                <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add Banner Images</Text>
              </TouchableOpacity>
              {bannerUris.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
                  {bannerUris.map((uri, index) => (
                    <View key={index} style={styles.bannerItem}>
                      <Image source={{ uri }} style={styles.bannerPreview} />
                      <TouchableOpacity
                        style={styles.removeBannerButton}
                        onPress={() => removeBanner(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              {errors.banners && (
                <Text style={styles.errorText}>{errors.banners}</Text>
              )}
            </View>
          )}

          {/* Advertisement Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter advertisement description"
              placeholderTextColor={COLORS.placeholderText}
              value={advertisementDescription}
              onChangeText={setAdvertisementDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Link */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Link URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={COLORS.placeholderText}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Link Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Link Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter link title"
              placeholderTextColor={COLORS.placeholderText}
              value={linkTitle}
              onChangeText={setLinkTitle}
            />
          </View>

          {/* Start Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date *</Text>
            {hasActivePlan && (
              <Text style={[styles.label, { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }]}>
                Must be between {formatDate(planStartDate)} and {formatDate(planEndDate)} (your plan period)
              </Text>
            )}
            <TouchableOpacity
              style={[styles.dateInput, errors.startDate && styles.dateInputError]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.dateInputContent}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                  {startDate ? formatDate(startDate) : "Select start date"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {errors.startDate && (
              <Text style={styles.errorText}>{errors.startDate}</Text>
            )}
            <DatePickerModal
              visible={showStartDatePicker}
              onClose={() => setShowStartDatePicker(false)}
              onSelect={(date) => {
                handleStartDateSelect(date);
                if (errors.startDate) {
                  setErrors({ ...errors, startDate: null });
                }
              }}
              minimumDate={hasActivePlan ? (planStartDate > new Date() ? planStartDate : new Date()) : new Date()}
              maximumDate={hasActivePlan ? planEndDate : undefined}
              initialDate={startDate || (hasActivePlan ? planStartDate : new Date())}
            />
          </View>

          {/* End Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date *</Text>
            {hasActivePlan && (
              <Text style={[styles.label, { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }]}>
                Must be before {formatDate(planEndDate)} (your plan end date)
              </Text>
            )}
            <TouchableOpacity
              style={[styles.dateInput, errors.endDate && styles.dateInputError]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.dateInputContent}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
                  {endDate ? formatDate(endDate) : "Select end date"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {errors.endDate && (
              <Text style={styles.errorText}>{errors.endDate}</Text>
            )}
            <DatePickerModal
              visible={showEndDatePicker}
              onClose={() => setShowEndDatePicker(false)}
              onSelect={(date) => {
                handleEndDateSelect(date);
                if (errors.endDate) {
                  setErrors({ ...errors, endDate: null });
                }
              }}
              minimumDate={startDate || (hasActivePlan ? planStartDate : null) || new Date()}
              maximumDate={hasActivePlan ? planEndDate : undefined}
              initialDate={endDate || startDate || (hasActivePlan ? planEndDate : null) || new Date()}
            />
          </View>

          {/* Allowed Countries */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Allowed Countries</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCountryPicker(true)}
            >
              <View style={styles.dateInputContent}>
                <Ionicons name="globe-outline" size={20} color={COLORS.textSecondary} />
                <View style={{ flex: 1 }}>
                  {selectedCountries.length > 0 ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                      {selectedCountries.slice(0, 2).map((country, index) => (
                        <View key={index} style={{ flexDirection: "row", alignItems: "center", marginRight: 4 }}>
                          {country.flag && (
                            <Image
                              source={{ uri: country.flag }}
                              style={{ width: 20, height: 15, marginRight: 4, borderRadius: 2 }}
                              contentFit="contain"
                            />
                          )}
                          <Text style={styles.dateText}>{country.name}</Text>
                        </View>
                      ))}
                      {selectedCountries.length > 2 && (
                        <Text style={styles.dateText}>+{selectedCountries.length - 2} more</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.dateText, styles.datePlaceholder]}>
                      Select countries (optional)
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Create Advertisement</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Multi Country Picker Modal */}
      <MultiCountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountries}
        selectedCountries={selectedCountries}
      />
    </Modal>
  );
}
