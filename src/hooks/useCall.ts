import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, addSocketListener, removeSocketListener } from '../services/socketClient';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UseCallOptions {
    bookingId: string;
    currentUserId: string;
    onIncomingCall?: (data: IncomingCallData) => void;
}

export interface IncomingCallData {
    callId: string;
    bookingId: string;
    caller: {
        id: string;
        name: string;
        profileImage?: string;
    };
    offer: RTCSessionDescriptionInit;
    iceServers: RTCIceServer[];
}

export const useCall = ({ bookingId, currentUserId, onIncomingCall }: UseCallOptions) => {
    const [callState, setCallState] = useState<CallState>('idle');
    const [callId, setCallId] = useState<string | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const iceServersRef = useRef<RTCIceServer[]>([
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]);

    // Clean up WebRTC resources
    const cleanupCall = useCallback(() => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        setCallDuration(0);
        setIsMuted(false);
        setIsSpeaker(false);
    }, []);

    // Create a peer connection
    const createPeerConnection = useCallback(
        (iceServers?: RTCIceServer[]) => {
            const socket = getSocket();
            const servers = iceServers || iceServersRef.current;

            const pc = new RTCPeerConnection({ iceServers: servers });

            pc.onicecandidate = (event) => {
                if (event.candidate && callId && socket?.connected) {
                    socket.emit('call:ice-candidate', {
                        callId,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('[Call] Connection state:', pc.connectionState);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    endCall();
                }
            };

            peerConnectionRef.current = pc;
            return pc;
        },
        [callId]
    );

    // Start duration timer
    const startDurationTimer = useCallback(() => {
        setCallDuration(0);
        durationIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    }, []);

    // Initiate a call
    const initiateCall = useCallback(async () => {
        const socket = getSocket();
        if (!socket?.connected || callState !== 'idle') return;

        try {
            // Get audio stream
            const { mediaDevices } = require('react-native-webrtc');
            const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const pc = createPeerConnection();

            // Add audio tracks to peer connection
            stream.getTracks().forEach((track: MediaStreamTrack) => {
                pc.addTrack(track, stream);
            });

            // Create offer
            const offer = await pc.createOffer({});
            await pc.setLocalDescription(offer);

            setCallState('calling');

            socket.emit('call:initiate', {
                bookingId,
                offer: pc.localDescription,
            });
        } catch (error) {
            console.error('[Call] Error initiating call:', error);
            cleanupCall();
            setCallState('idle');
        }
    }, [bookingId, callState, createPeerConnection, cleanupCall]);

    // Answer an incoming call
    const answerCall = useCallback(
        async (incomingData: IncomingCallData) => {
            const socket = getSocket();
            if (!socket?.connected) return;

            try {
                const { mediaDevices } = require('react-native-webrtc');
                const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream;

                iceServersRef.current = incomingData.iceServers;
                const pc = createPeerConnection(incomingData.iceServers);

                stream.getTracks().forEach((track: MediaStreamTrack) => {
                    pc.addTrack(track, stream);
                });

                await pc.setRemoteDescription(incomingData.offer);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                setCallId(incomingData.callId);
                setCallState('connected');
                startDurationTimer();

                socket.emit('call:answer', {
                    callId: incomingData.callId,
                    answer: pc.localDescription,
                });
            } catch (error) {
                console.error('[Call] Error answering call:', error);
                cleanupCall();
                setCallState('idle');
            }
        },
        [createPeerConnection, cleanupCall, startDurationTimer]
    );

    // Reject an incoming call
    const rejectCall = useCallback(
        (incomingCallId: string) => {
            const socket = getSocket();
            if (!socket?.connected) return;

            socket.emit('call:reject', { callId: incomingCallId });
            setCallState('idle');
        },
        []
    );

    // End the call
    const endCall = useCallback(() => {
        const socket = getSocket();
        if (callId && socket?.connected) {
            socket.emit('call:end', { callId });
        }

        cleanupCall();
        setCallState('ended');
        setCallId(null);

        // Reset to idle after a short delay
        setTimeout(() => setCallState('idle'), 2000);
    }, [callId, cleanupCall]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle speaker (handled natively by react-native-webrtc InCallManager)
    const toggleSpeaker = useCallback(() => {
        setIsSpeaker((prev) => !prev);
        // Note: Actual speaker toggle requires InCallManager from react-native-webrtc
    }, []);

    // Socket event listeners
    useEffect(() => {
        const handleCallInitiated = (data: { callId: string; iceServers: RTCIceServer[] }) => {
            setCallId(data.callId);
            iceServersRef.current = data.iceServers;
        };

        const handleIncomingCall = (data: IncomingCallData) => {
            if (data.bookingId === bookingId) {
                setCallState('ringing');
                setCallId(data.callId);
                onIncomingCall?.(data);
            }
        };

        const handleCallAnswered = async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                await pc.setRemoteDescription(data.answer);
                setCallState('connected');
                startDurationTimer();
            } catch (error) {
                console.error('[Call] Error setting remote description:', error);
                endCall();
            }
        };

        const handleIceCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                const { RTCIceCandidate } = require('react-native-webrtc');
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('[Call] Error adding ICE candidate:', error);
            }
        };

        const handleCallRejected = () => {
            cleanupCall();
            setCallState('ended');
            setCallId(null);
            setTimeout(() => setCallState('idle'), 2000);
        };

        const handleCallEnded = () => {
            cleanupCall();
            setCallState('ended');
            setCallId(null);
            setTimeout(() => setCallState('idle'), 2000);
        };

        const handleCallMissed = () => {
            cleanupCall();
            setCallState('idle');
            setCallId(null);
        };

        addSocketListener('call:initiated', handleCallInitiated);
        addSocketListener('call:incoming', handleIncomingCall);
        addSocketListener('call:answered', handleCallAnswered);
        addSocketListener('call:ice-candidate', handleIceCandidate);
        addSocketListener('call:rejected', handleCallRejected);
        addSocketListener('call:ended', handleCallEnded);
        addSocketListener('call:missed', handleCallMissed);

        return () => {
            removeSocketListener('call:initiated', handleCallInitiated);
            removeSocketListener('call:incoming', handleIncomingCall);
            removeSocketListener('call:answered', handleCallAnswered);
            removeSocketListener('call:ice-candidate', handleIceCandidate);
            removeSocketListener('call:rejected', handleCallRejected);
            removeSocketListener('call:ended', handleCallEnded);
            removeSocketListener('call:missed', handleCallMissed);
            cleanupCall();
        };
    }, [bookingId, onIncomingCall, cleanupCall, endCall, startDurationTimer]);

    return {
        callState,
        callId,
        callDuration,
        isMuted,
        isSpeaker,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
    };
};
