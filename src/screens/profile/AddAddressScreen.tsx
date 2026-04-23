import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addAddress, updateAddress } from '../../store/slices/authSlice';
import { requireLocationPermission } from '../../hooks/useLocation';
import { userApi } from '../../api/client';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 200;

// Address labels
const ADDRESS_LABELS = ['Home', 'Work', 'Other'];

// Route params
type RouteParams = {
    address?: {
        id: string;
        label: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        latitude?: number;
        longitude?: number;
        isDefault: boolean;
    };
};

const AddAddressScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.auth);

    const mapRef = useRef<MapView>(null);
    const editingAddress = route.params?.address;

    const [location, setLocation] = useState({
        latitude: editingAddress?.latitude || 28.6139,
        longitude: editingAddress?.longitude || 77.2090,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });

    const [label, setLabel] = useState(editingAddress?.label || 'Home');
    const [addressLine1, setAddressLine1] = useState(editingAddress?.addressLine1 || '');
    const [addressLine2, setAddressLine2] = useState(editingAddress?.addressLine2 || '');
    const [city, setCity] = useState(editingAddress?.city || '');
    const [state, setState] = useState(editingAddress?.state || '');
    const [pincode, setPincode] = useState(editingAddress?.pincode || '');
    const [isDefault, setIsDefault] = useState(editingAddress?.isDefault || false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (!editingAddress) {
            getCurrentLocation();
        }
    }, []);

    // Get current location
    const getCurrentLocation = async () => {
        setIsLocating(true);
        requireLocationPermission(
            async () => {
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High,
                    });

                    const { latitude, longitude } = location.coords;

                    setLocation((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                    }));

                    mapRef.current?.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 1000);

                    // Reverse geocode to get address details
                    await reverseGeocode(latitude, longitude);

                } catch (error) {
                    console.error('Error getting location:', error);
                    Alert.alert('Location Error', 'Failed to get current location');
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to detect your location.'
                );
            }
        );
    };

    // Reverse geocode
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const [address] = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });

            if (address) {
                // Build human-readable address, avoiding Plus Codes from address.name
                const streetParts = [
                    address.street,
                    address.district,
                    address.subregion,
                ].filter(Boolean);
                const streetAddress = streetParts.length > 0
                    ? streetParts.join(', ')
                    : (address.name && !address.name.includes('+') ? address.name : '');
                setAddressLine1(streetAddress);
                setCity(address.city || address.subregion || '');
                setState(address.region || '');
                setPincode(address.postalCode || '');
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    };

    // Handle map press
    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setLocation((prev) => ({ ...prev, latitude, longitude }));
        reverseGeocode(latitude, longitude);
    };

    // Validate form
    const validateForm = () => {
        if (!addressLine1.trim()) {
            Alert.alert('Required', 'Please enter address line 1');
            return false;
        }
        if (!city.trim()) {
            Alert.alert('Required', 'Please enter city');
            return false;
        }
        if (!state.trim()) {
            Alert.alert('Required', 'Please enter state');
            return false;
        }
        if (!pincode.trim() || pincode.length < 6) {
            Alert.alert('Required', 'Please enter a valid pincode');
            return false;
        }
        return true;
    };

    // Save address
    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const formattedAddress = `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} - ${pincode}, India`;
            const addressData = {
                label,
                streetAddress: addressLine1 + (addressLine2 ? ', ' + addressLine2 : ''),
                city,
                state,
                postalCode: pincode,
                country: 'IN',
                formattedAddress,
                latitude: location.latitude,
                longitude: location.longitude,
                isDefault,
            };

            if (editingAddress) {
                await dispatch(updateAddress({
                    id: editingAddress.id,
                    data: addressData,
                })).unwrap();
                Alert.alert('Success', 'Address updated successfully');
            } else {
                await dispatch(addAddress(addressData)).unwrap();
                Alert.alert('Success', 'Address added successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Save address error:', error);
            Alert.alert('Error', error.message || 'Failed to save address');
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Map View */}
                        <View style={styles.mapContainer}>
                            <MapView
                                ref={mapRef}
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                region={location}
                                onPress={handleMapPress}
                                showsUserLocation
                                showsMyLocationButton={false}
                            >
                                <Marker coordinate={location} />
                            </MapView>
                            <TouchableOpacity
                                style={styles.locateButton}
                                onPress={getCurrentLocation}
                                disabled={isLocating}
                            >
                                {isLocating ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <Ionicons name="locate" size={24} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapOverlayText}>Tap map to set location</Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Label Selection */}
                            <View style={styles.labelSection}>
                                <Text style={styles.inputLabel}>ADDRESS TYPE</Text>
                                <View style={styles.labelContainer}>
                                    {ADDRESS_LABELS.map((l) => (
                                        <TouchableOpacity
                                            key={l}
                                            style={[
                                                styles.labelChip,
                                                label === l && styles.activeLabelChip
                                            ]}
                                            onPress={() => setLabel(l)}
                                        >
                                            <Ionicons
                                                name={l === 'Home' ? 'home' : l === 'Work' ? 'briefcase' : 'location'}
                                                size={16}
                                                color={label === l ? COLORS.white : COLORS.textSecondary}
                                            />
                                            <Text style={[
                                                styles.labelText,
                                                label === l && styles.activeLabelText
                                            ]}>
                                                {l}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Address Fields */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>ADDRESS LINE 1</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressLine1}
                                    onChangeText={setAddressLine1}
                                    placeholder="House No., Building, Street Area"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>ADDRESS LINE 2 (OPTIONAL)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressLine2}
                                    onChangeText={setAddressLine2}
                                    placeholder="Landmark, Floor, etc."
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfInput]}>
                                    <Text style={styles.inputLabel}>CITY</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="City"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>
                                <View style={[styles.inputGroup, styles.halfInput]}>
                                    <Text style={styles.inputLabel}>PINCODE</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={pincode}
                                        onChangeText={setPincode}
                                        placeholder="000000"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>STATE</Text>
                                <TextInput
                                    style={styles.input}
                                    value={state}
                                    onChangeText={setState}
                                    placeholder="State"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            {/* Default Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setIsDefault(!isDefault)}
                            >
                                <View style={[styles.checkbox, isDefault && styles.checkedCheckbox]}>
                                    {isDefault && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as default address</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomPadding} />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Address</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    mapContainer: {
        height: MAP_HEIGHT,
        width: '100%',
        position: 'relative',
        marginBottom: SPACING.lg,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    locateButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: COLORS.white,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    mapOverlay: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    mapOverlayText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    formContainer: {
        paddingHorizontal: SPACING.lg,
    },
    labelSection: {
        marginBottom: SPACING.xl,
    },
    labelContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    labelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    activeLabelChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    labelText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    activeLabelText: {
        color: COLORS.white,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 14,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    halfInput: {
        flex: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.textLight,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedCheckbox: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    bottomPadding: {
        height: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.lg,
        ...SHADOWS.heavy,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default AddAddressScreen;
