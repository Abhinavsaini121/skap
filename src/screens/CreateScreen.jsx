import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import styles from "../../assets/styles/signup.styles";
import COLORS from "../../constants/colors";
import { useCreateReelMutation } from "../../services/reelsApi";
import { tokenStorage } from "../../utils/tokenStorage";

export default function CreateScreen() {
  const navigation = useNavigation();
  const [caption, setCaption] = useState("");
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createReel] = useCreateReelMutation();

  const pickVideo = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need media library permission to select a video");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16], // Better aspect ratio for reels
        quality: 0.8, // Higher quality
        videoMaxDuration: 60, // 60 seconds max
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        setVideoUri(selectedVideo.uri);
      }
    } catch (error) {
      Alert.alert("Error", "There was a problem selecting your video");
    }
  };

  const handleSubmit = async () => {
    try {
      // Check for token from AsyncStorage
      const accessToken = await tokenStorage.getAccessToken();
      
      if (!accessToken) {
        Alert.alert("Login required", "Please login to upload a reel.");
        return;
      }
      
      if (!caption || !videoUri) {
        Alert.alert("Error", "Caption and video are required");
        return;
      }

      setLoading(true);
      
      // Create FormData with proper video file handling
      const formData = new FormData();
      formData.append("caption", caption);
      
      // Get file extension from URI
      const uriParts = videoUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append("video", {
        uri: videoUri,
        name: `reel-${Date.now()}.${fileType}`,
        type: `video/${fileType}`,
      });

      
      const result = await createReel(formData).unwrap();
      
      Alert.alert("Success", "Reel uploaded successfully");
      setCaption("");
      setVideoUri(null);
      
      // Navigate to profile tab with query param to open AllReelsScreen
      navigation.navigate('Profile', { openReels: true });
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Could not upload reel";
      Alert.alert("Upload failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Reel</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.label, { textAlign: "center", marginBottom: 24, fontSize: 14, color: COLORS.textSecondary }]}>
            Share a short video with your caption
          </Text>

          {/* VIDEO PICKER */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Video *</Text>
            <TouchableOpacity 
              style={{
                width: "100%",
                height: 200,
                backgroundColor: COLORS.inputBackground,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: "hidden",
              }} 
              onPress={pickVideo}
            >
              {videoUri ? (
                <Video
                  source={{ uri: videoUri }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay={false}
                />
              ) : (
                <View style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Ionicons name="videocam-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={{
                    color: COLORS.textSecondary,
                    marginTop: 8,
                    fontSize: 14,
                  }}>Tap to select video</Text>
                </View>
              )}
            </TouchableOpacity>
            {videoUri && (
              <Text style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                marginTop: 4,
              }}>Video selected: {videoUri.split('/').pop()}</Text>
            )}
          </View>

          {/* CAPTION */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Caption *</Text>
            <View style={{
              backgroundColor: COLORS.inputBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 16,
              paddingVertical: 4,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: COLORS.textPrimary,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Write a caption for your reel..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
            </View>
            <Text style={{
              fontSize: 12,
              color: COLORS.textSecondary,
              marginTop: 4,
              textAlign: "right",
            }}>{caption.length}/500</Text>
          </View>

          {/* UPLOAD BUTTON */}
          <TouchableOpacity 
            style={[styles.submitButton, (loading || !caption || !videoUri) && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            disabled={loading || !caption || !videoUri}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Upload Reel</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
