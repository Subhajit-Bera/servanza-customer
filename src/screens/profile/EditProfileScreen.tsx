import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { userApi } from '../../api/client';

const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    // Form state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone?.replace(/^\+91/, '') || '');
    const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

    // Loading states
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Validation
    const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

    // Pick image from gallery
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            uploadImage(result.assets[0].uri);
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            uploadImage(result.assets[0].uri);
        }
    };

    // Upload image to backend
    const uploadImage = async (uri: string) => {
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri,
                name: filename,
                type,
            } as any);

            const response = await userApi.uploadProfileImage(formData);
            const imageUrl = response.data?.data?.imageUrl || response.data?.imageUrl;

            if (imageUrl) {
                setProfileImage(imageUrl);
                Alert.alert('Success', 'Profile picture updated!');
            }
        } catch (error: any) {
            console.error('Image upload error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Show image picker options
    const showImageOptions = () => {
        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: { name?: string; phone?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (phone && phone.length !== 10) {
            newErrors.phone = 'Phone number must be 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save profile
    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const resultAction = await dispatch(updateProfile({
                name: name.trim(),
                phone: phone.trim() ? `+91${phone.trim()}` : undefined,
            }));

            if (updateProfile.fulfilled.match(resultAction)) {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', (resultAction.payload as string) || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Image */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity
                            style={styles.imageContainer}
                            onPress={showImageOptions}
                            disabled={isUploadingImage}
                        >
                            {isUploadingImage ? (
                                <View style={styles.imageLoading}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                </View>
                            ) : profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="person" size={50} color={COLORS.mediumGray} />
                                </View>
                            )}
                            {/* <View style={styles.cameraButton}>
                                <Ionicons name="camera" size={18} color={COLORS.white} />
                            </View> */}
                        </TouchableOpacity>
                        {/* <Text style={styles.changePhotoText}>Tap to change photo</Text> */}
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                                <Ionicons name="person-outline" size={20} color={COLORS.mediumGray} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={COLORS.mediumGray}
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        {/* Email (Read-only) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.inputContainer, styles.inputDisabled]}>
                                <Ionicons name="mail-outline" size={20} color={COLORS.mediumGray} />
                                <TextInput
                                    style={[styles.input, styles.inputTextDisabled]}
                                    value={email}
                                    editable={false}
                                />
                                <Ionicons name="lock-closed" size={16} color={COLORS.mediumGray} />
                            </View>
                            <Text style={styles.helperText}>Email cannot be changed</Text>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                                <Ionicons name="call-outline" size={20} color={COLORS.mediumGray} />
                                <Text style={styles.phonePrefix}>+91</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={(text) => {
                                        // Only allow digits, max 10
                                        const digits = text.replace(/\D/g, '').slice(0, 10);
                                        setPhone(digits);
                                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                                    }}
                                    placeholder="10-digit number"
                                    placeholderTextColor={COLORS.mediumGray}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    saveButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    saveButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    imageContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 60,
        ...SHADOWS.medium,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoading: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    changePhotoText: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
        marginBottom: SPACING.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.transparent,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    inputDisabled: {
        backgroundColor: COLORS.lightGray,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
    },
    inputTextDisabled: {
        color: COLORS.mediumGray,
    },
    phonePrefix: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
        marginRight: 2,
    },
    errorText: {
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.error,
    },
    helperText: {
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
    },
});

export default EditProfileScreen;
