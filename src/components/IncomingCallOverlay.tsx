import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme';
import { useSocketEvent } from '../hooks/useSocket';
import { IncomingCallData } from '../hooks/useCall';
import InCallManager from 'react-native-incall-manager';

const { width } = Dimensions.get('window');

const IncomingCallOverlay = () => {
    const navigation = useNavigation<any>();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const translateY = new Animated.Value(-200);

    // Listen for incoming calls globally
    const { onEvent: onIncomingCall } = useSocketEvent<IncomingCallData>('call:incoming');
    const { onEvent: onCallMissed } = useSocketEvent('call:missed');
    const { onEvent: onCallEnded } = useSocketEvent('call:ended');

    useEffect(() => {
        onIncomingCall((data) => {
            setIncomingCall(data);
            // Play ringtone and vibrate
            InCallManager.startRingtone('_DEFAULT_', [1000, 500], 'playback', 30);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 12,
            }).start();
        });

        const closeOverlay = () => {
            InCallManager.stopRingtone();
            Animated.timing(translateY, {
                toValue: -200,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIncomingCall(null));
        };

        onCallMissed(closeOverlay);
        onCallEnded(closeOverlay);
    }, [onIncomingCall, onCallMissed, onCallEnded, translateY]);

    if (!incomingCall) return null;

    const handleAccept = () => {
        // Stop ringtone before navigating
        InCallManager.stopRingtone();
        // Navigate to Call screen and pass the incoming call data for answering
        navigation.navigate('VoiceCall', {
            bookingId: incomingCall.bookingId,
            buddyName: incomingCall.caller.name,
            isIncoming: true,
            callId: incomingCall.callId,
            _incomingCallData: incomingCall,
        });
        setIncomingCall(null);
    };

    const handleReject = () => {
        InCallManager.stopRingtone();
        import('../services/socketClient').then(({ getSocket }) => {
            const socket = getSocket();
            if (socket?.connected) {
                socket.emit('call:reject', { callId: incomingCall.callId });
            }
        });
        
        Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setIncomingCall(null));
    };

    return (
        <Modal transparent visible={!!incomingCall} animationType="none">
            <View style={styles.container}>
                <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
                    <View style={styles.callerInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {incomingCall.caller.name.charAt(0)}
                            </Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>Incoming Call</Text>
                            <Text style={styles.name}>{incomingCall.caller.name}</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={[styles.button, styles.rejectButton]} 
                            onPress={handleReject}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.acceptButton]} 
                            onPress={handleAccept}
                        >
                            <Ionicons name="call" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingTop: 60,
        alignItems: 'center',
    },
    card: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    callerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.mediumGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.charcoal,
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    button: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
    },
});

export default IncomingCallOverlay;
