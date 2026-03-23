import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSendResetPasswordOtpMutation, useResetPasswordMutation } from "../services/authApi";
import styles from "../assets/styles/signup.styles";
import COLORS from "../constants/colors";

const ForgotPasswordModal = ({ visible, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [sendOtp, { isLoading: isSendingOtp }] = useSendResetPasswordOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

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

  const validateStep1 = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    } else if (otp.trim().length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!newPassword.trim()) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateStep1()) {
      return;
    }

    try {
      const res = await sendOtp({ email: email.trim() }).unwrap();
      Alert.alert("Success", res.message || "OTP sent to your email");
      setErrors({});
      setStep(2);
    } catch (error) {
      console.error("Send OTP error:", error);
      Alert.alert("Error", error?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateStep2()) {
      return;
    }

    // Move to password reset step
    setErrors({});
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!validateStep3()) {
      return;
    }

    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      }).unwrap();
      
      Alert.alert("Success", res.message || "Password reset successfully", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            onClose();
          }
        }
      ]);
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error?.data?.message || "Failed to reset password");
    }
  };

  const resetForm = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStep1 = () => (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password?</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { textAlign: "center", marginBottom: 16, fontSize: 14, color: COLORS.textSecondary }]}>
          Enter your email address and we'll send you an OTP to reset your password.
        </Text>

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
              placeholderTextColor={COLORS.placeholderText}
              value={email}
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

        {/* SEND OTP BUTTON */}
        <TouchableOpacity
          style={[styles.submitButton, isSendingOtp && styles.submitButtonDisabled]}
          onPress={handleSendOtp}
          disabled={isSendingOtp}
        >
          {isSendingOtp ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="mail" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Send OTP</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            setErrors({});
            setStep(1);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Enter OTP</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { textAlign: "center", marginBottom: 16, fontSize: 14, color: COLORS.textSecondary }]}>
          We've sent a 6-digit code to {email}
        </Text>

        {/* OTP INPUT */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>OTP Code *</Text>
          <View style={[styles.inputContainer, errors.otp && styles.inputError]}>
            <Ionicons
              name="key-outline"
              size={20}
              color={errors.otp ? COLORS.error : COLORS.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { textAlign: "center", fontSize: 18, letterSpacing: 4 }]}
              placeholder="6-digit code"
              placeholderTextColor={COLORS.placeholderText}
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                clearError("otp");
              }}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
        </View>

        {/* VERIFY OTP BUTTON */}
        <TouchableOpacity
          style={[styles.submitButton, isResetting && styles.submitButtonDisabled]}
          onPress={handleVerifyOtp}
          disabled={isResetting}
        >
          {isResetting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Verify OTP</Text>
            </>
          )}
        </TouchableOpacity>

        {/* RESEND OTP OPTION */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleSendOtp} disabled={isSendingOtp}>
            <Text style={styles.link}>
              {isSendingOtp ? "Sending..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            setErrors({});
            setStep(2);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Set New Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { textAlign: "center", marginBottom: 16, fontSize: 14, color: COLORS.textSecondary }]}>
          Enter your new password below.
        </Text>

        {/* NEW PASSWORD INPUT */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password *</Text>
          <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={errors.newPassword ? COLORS.error : COLORS.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="******"
              placeholderTextColor={COLORS.placeholderText}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                clearError("newPassword");
                // Clear confirm password error if passwords match
                if (text === confirmPassword && errors.confirmPassword) {
                  clearError("confirmPassword");
                }
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
                color={errors.newPassword ? COLORS.error : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
        </View>

        {/* CONFIRM PASSWORD INPUT */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={errors.confirmPassword ? COLORS.error : COLORS.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="******"
              placeholderTextColor={COLORS.placeholderText}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError("confirmPassword");
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={errors.confirmPassword ? COLORS.error : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        {/* RESET PASSWORD BUTTON */}
        <TouchableOpacity
          style={[styles.submitButton, isResetting && styles.submitButtonDisabled]}
          onPress={handleResetPassword}
          disabled={isResetting}
        >
          {isResetting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Reset Password</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ForgotPasswordModal;
