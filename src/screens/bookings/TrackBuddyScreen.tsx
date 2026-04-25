import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useBuddyLocation, useSocket, useBookingStatus } from '../../hooks/useSocket';
import type { BookingsStackParamList } from '../../navigation/MainNavigator';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Default location (will be replaced with user's location or booking address)
const DEFAULT_LOCATION = {
    latitude: 12.9716,
    longitude: 77.5946,
};

type TrackBuddyRouteProp = RouteProp<BookingsStackParamList, 'TrackBuddy'>;

const TrackBuddyScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<TrackBuddyRouteProp>();
    const mapRef = useRef<MapView>(null);

    const { bookingId } = route.params;
    const { connected } = useSocket();
    const { location: buddyLocation, eta } = useBuddyLocation(bookingId);
    const { status } = useBookingStatus(bookingId);

    const [customerLocation] = useState(DEFAULT_LOCATION);
    const [isMapReady, setIsMapReady] = useState(false);
    const [showEta, setShowEta] = useState(true);
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (eta?.minutes != null) {
            setEtaSeconds(eta.minutes * 60);
        }
    }, [eta?.minutes]);

    useEffect(() => {
        if (etaSeconds === null || etaSeconds <= 0) return;

        const intervalId = setInterval(() => {
            setEtaSeconds((prev) => (prev != null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [etaSeconds]);

    const formatEta = (seconds: number | null) => {
        if (seconds == null) return '--:--';
        if (seconds <= 0) return 'Arriving';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s} min`;
    };

    // Fit map to show both markers
    const fitToMarkers = () => {
        if (mapRef.current && buddyLocation) {
            mapRef.current.fitToCoordinates(
                [
                    { latitude: customerLocation.latitude, longitude: customerLocation.longitude },
                    { latitude: buddyLocation.latitude, longitude: buddyLocation.longitude },
                ],
                {
                    edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
                    animated: true,
                }
            );
        }
    };

    useEffect(() => {
        if (isMapReady && buddyLocation) {
            fitToMarkers();
        }
    }, [isMapReady, buddyLocation?.latitude, buddyLocation?.longitude]);

    const getStatusText = () => {
        switch (status) {
            case 'ASSIGNED':
                return 'Buddy is on the way';
            case 'IN_PROGRESS':
                return 'Service in progress';
            case 'COMPLETED':
                return 'Service completed';
            default:
                return 'Tracking buddy...';
        }
    };

    return (
        <View style={styles.container}>
            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: customerLocation.latitude,
                        longitude: customerLocation.longitude,
                        latitudeDelta: LATITUDE_DELTA,
                        longitudeDelta: LONGITUDE_DELTA,
                    }}
                    onMapReady={() => setIsMapReady(true)}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    rotateEnabled={true}
                    zoomEnabled={true}
                    customMapStyle={[
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]}
                >
                    {/* Customer marker (House) */}
                    <Marker
                        coordinate={customerLocation}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.customerMarker}>
                            <View style={styles.customerMarkerInner}>
                                <Ionicons name="home" size={16} color={COLORS.primary} />
                            </View>
                        </View>
                    </Marker>

                    {/* Buddy marker (Bicycle/Scooter) */}
                    {buddyLocation && (
                        <Marker
                            coordinate={{
                                latitude: buddyLocation.latitude,
                                longitude: buddyLocation.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.buddyMarker}>
                                <View style={styles.buddyMarkerInner}>
                                    <Ionicons name="bicycle" size={18} color={COLORS.white} />
                                </View>
                            </View>
                        </Marker>
                    )}

                    {/* Route line */}
                    {buddyLocation && (
                        <Polyline
                            coordinates={[
                                { latitude: buddyLocation.latitude, longitude: buddyLocation.longitude },
                                customerLocation,
                            ]}
                            strokeColor={COLORS.primary}
                            strokeWidth={4}
                            lineDashPattern={[10, 5]}
                        />
                    )}
                </MapView>
            </View>

            {/* Header Overlay */}
            <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.statusPill}>
                        <View style={[styles.connectionDot, { backgroundColor: connected ? COLORS.success : COLORS.error }]} />
                        <Text style={styles.statusPillText}>{connected ? 'Live' : 'Connecting...'}</Text>
                    </View>
                </View>
                
                {/* Offline Banner */}
                {!connected && (
                    <View style={styles.offlineBanner}>
                        <Ionicons name="warning" size={16} color={COLORS.white} />
                        <Text style={styles.offlineText}>Connection lost. Reconnecting...</Text>
                    </View>
                )}
            </SafeAreaView>

            {/* Recenter Button */}
            <TouchableOpacity style={styles.centerButton} onPress={fitToMarkers}>
                <Ionicons name="locate" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {/* Bottom info card */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                {!buddyLocation ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Locating your buddy...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.buddyProfile}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: 'https://via.placeholder.com/100' }}
                                    style={styles.avatar}
                                />
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={10} color={COLORS.white} />
                                    <Text style={styles.ratingText}>4.9</Text>
                                </View>
                            </View>
                            <View style={styles.buddyInfo}>
                                <Text style={styles.buddyName}>Rahul Kumar</Text>
                                <Text style={styles.buddyRole}>Top Rated Professional</Text>
                                <Text style={styles.serviceStatus}>{getStatusText()}</Text>
                            </View>
                            <View style={styles.callButtonContainer}>
                                <TouchableOpacity style={styles.phoneButton}>
                                    <Ionicons name="call" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {eta && showEta && (
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{formatEta(etaSeconds)}</Text>
                                    <Text style={styles.statLabel}>Arriving in</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{eta.distance}</Text>
                                    <Text style={styles.statLabel}>Distance</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageButtonText}>Message Buddy</Text>
                            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    mapContainer: {
        flex: 1,
        backgroundColor: COLORS.offWhite,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: 'box-none',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        ...SHADOWS.medium,
    },
    statusPillText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    offlineBanner: {
        backgroundColor: COLORS.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.xs,
        ...SHADOWS.light,
    },
    offlineText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    centerButton: {
        position: 'absolute',
        right: SPACING.lg,
        bottom: 340, // Above bottom sheet
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    customerMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(46, 171, 110, 0.2)', // COLORS.primary with opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerMarkerInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    buddyMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    buddyMarkerInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        ...SHADOWS.heavy,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    buddyProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.inputBackground,
    },
    ratingBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.star,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    buddyInfo: {
        flex: 1,
    },
    buddyName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    buddyRole: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    serviceStatus: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    callButtonContainer: {
        justifyContent: 'center',
    },
    phoneButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.green,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginBottom: SPACING.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.primaryLight,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    messageButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    messageButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
});

export default TrackBuddyScreen;
