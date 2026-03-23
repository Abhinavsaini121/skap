import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ProfileEditForm from "../../components/ProfileEditForm";
import COLORS from "../../constants/colors";

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleClose = () => {
        // Use goBack() to return to previous screen (Profile tab)
        // If that doesn't work, fallback to navigating to Main with Profile tab
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Fallback: navigate to Main navigator with Profile tab
            navigation.navigate('Main', { screen: 'Profile' });
        }
    };

    const handleSuccess = () => {
        // After successful profile update, navigate back to Profile tab
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Main', { screen: 'Profile' });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.white}
                translucent={true}
                animated={true}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
            >
                <View style={{ flex: 1 }}>
                    <ProfileEditForm onCancel={handleClose} onSuccess={handleSuccess} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

