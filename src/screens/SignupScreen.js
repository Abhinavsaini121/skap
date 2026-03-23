import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { useRegisterMutation, useVerifyEmailMutation } from "../../services/authApi";
import CountryPickerModal from "../../components/CountryPickerModal";
  
  export default function SignupScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("form"); // form -> verify
    const [errors, setErrors] = useState({});
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsText, setShowTermsText] = useState(false);
    const [registerUser] = useRegisterMutation();
    const [verifyEmail] = useVerifyEmailMutation();
  
    const navigation = useNavigation();

    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const clearError = (field) => {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    };

    const validateForm = () => {
      const newErrors = {};

      if (!username.trim()) {
        newErrors.username = "Username is required";
      }

      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!termsAccepted) {
        newErrors.termsConditions = "You must accept the Terms & Conditions to sign up";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSignUp = async () => {
      if (!validateForm()) {
        return;
      }
      try {
        setIsLoading(true);
        await registerUser({
          name: username,
          email,
          password,
          ...(country?.name && { country: country.name }),
          role: "user",
          termsConditions: true,
        }).unwrap();
        setIsLoading(false);
        setStep("verify");
        Alert.alert("OTP Sent", "Please check your email for the verification code.");
      } catch (e) {
        setIsLoading(false);
        Alert.alert("Error", e?.data?.message || "Registration failed");
      }
    };

    const handleVerify = async () => {
      if (!otp) {
        Alert.alert("Error", "Enter the OTP sent to your email");
        return;
      }
      try {
        setIsLoading(true);
        await verifyEmail({ email, otp: String(otp).trim() }).unwrap();
        setIsLoading(false);
        Alert.alert("Success", "Email verified. You can login now.");
        navigation.goBack();
      } catch (e) {
        setIsLoading(false);
        Alert.alert("Error", e?.data?.message || "Verification failed");
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>{step === "form" ? "Sign Up" : "Verify Email"}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === "form" ? (
              <>
                {/* USERNAME INPUT */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username *</Text>
                  <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={errors.username ? COLORS.error : COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="johndoe"
                      placeholderTextColor={COLORS.placeholderText}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        clearError("username");
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                {/* EMAIL INPUT */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email *</Text>
                  <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={errors.email ? COLORS.error : COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="johndoe@gmail.com"
                      value={email}
                      placeholderTextColor={COLORS.placeholderText}
                      onChangeText={(text) => {
                        setEmail(text);
                        clearError("email");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={errors.password ? COLORS.error : COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="******"
                      placeholderTextColor={COLORS.placeholderText}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        clearError("password");
                      }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={errors.password ? COLORS.error : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* COUNTRY INPUT */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Country (optional)</Text>
                  <TouchableOpacity
                    onPress={() => setShowCountryPicker(true)}
                    style={[styles.inputContainer, errors.country && styles.inputError]}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color={errors.country ? COLORS.error : COLORS.textSecondary}
                      style={styles.inputIcon}
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
                      color={errors.country ? COLORS.error : COLORS.textSecondary}
                      style={styles.chevronIcon}
                    />
                  </TouchableOpacity>
                  {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
                </View>

                {/* TERMS & CONDITIONS */}
                <View style={styles.termsSection}>
                  <TouchableOpacity
                    style={styles.termsToggleRow}
                    onPress={() => setShowTermsText((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showTermsText ? "document-text" : "document-text-outline"}
                      size={20}
                      color={COLORS.primary}
                      style={styles.termsToggleIcon}
                    />
                    <Text style={styles.termsToggleLabel}>Terms & Conditions</Text>
                    <Ionicons
                      name={showTermsText ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {showTermsText && (
                    <View style={styles.termsBodyBox}>
                      <Text style={styles.termsBody}>
                        By using this app you agree to our Terms of Service and Community Guidelines.
                        {"\n\n"}
                        The following content is not allowed: abusive, sexual, hateful, or violent content.
                        {"\n\n"}
                        Violations may result in account suspension or removal.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => {
                      setTermsAccepted((prev) => !prev);
                      clearError("termsConditions");
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                      {termsAccepted && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>I agree to the Terms & Conditions</Text>
                  </TouchableOpacity>
                  {errors.termsConditions && (
                    <Text style={styles.errorText}>{errors.termsConditions}</Text>
                  )}
                </View>

                {/* SIGNUP BUTTON */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="person-add" size={20} color={COLORS.white} />
                      <Text style={styles.submitButtonText}>Sign Up</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* FOOTER */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.link}>Login</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Enter OTP *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="key-outline"
                      size={20}
                      color={COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor={COLORS.placeholderText}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleVerify}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={styles.submitButtonText}>Verify Email</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Country Picker Modal */}
        <CountryPickerModal
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          onSelect={(selectedCountry) => {
            setCountry(selectedCountry);
            clearError("country");
          }}
          selectedCountry={country}
        />
      </KeyboardAvoidingView>
    );
  }
  