import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import { useSubmitReportMutation } from "../../services/reportApi";

const REASONS = [
  { value: "abuse", label: "Abuse" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

export default function ReportUserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { reportedUserId, reportedUserName } = route.params || {};
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitReport, { isLoading }] = useSubmitReportMutation();

  const handleSubmit = async () => {
    if (!reportedUserId) {
      Alert.alert("Error", "Invalid user.");
      return;
    }
    if (!reason) {
      Alert.alert("Required", "Please select a reason for the report.");
      return;
    }
    try {
      await submitReport({
        reportedUserId,
        contentType: "message",
        reason,
        description: description.trim() || "",
      }).unwrap();
      Alert.alert("Report submitted", "Thank you. We will review this report.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const message =
        err?.data?.message || err?.message || "Failed to submit report.";
      Alert.alert("Error", message);
    }
  };

  if (!reportedUserId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid user. Go back.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {reportedUserName && (
            <Text style={styles.subtitle}>
              Reporting: <Text style={styles.subtitleBold}>{reportedUserName}</Text>
            </Text>
          )}

          <Text style={styles.label}>Reason *</Text>
          <View style={styles.reasonList}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.reasonItem, reason === r.value && styles.reasonItemActive]}
                onPress={() => setReason(r.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={reason === r.value ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={reason === r.value ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.reasonLabel,
                    reason === r.value && styles.reasonLabelActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Additional details (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe what happened..."
            placeholderTextColor={COLORS.placeholderText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="flag" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerRight: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  subtitleBold: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  reasonList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reasonItemActive: {
    backgroundColor: COLORS.primary + "15",
  },
  reasonLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  reasonLabelActive: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 100,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});
