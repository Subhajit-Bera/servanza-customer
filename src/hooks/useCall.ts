import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, addSocketListener, removeSocketListener } from '../services/socketClient';
import { WEBRTC_CONFIG } from '../config/constants';
import InCallManager from 'react-native-incall-manager';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';

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
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callIdRef = useRef<string | null>(null);
    const iceServersRef = useRef<RTCIceServer[]>(WEBRTC_CONFIG.iceServers);

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

        // Stop InCallManager audio session
        InCallManager?.stop();

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

            (pc as any).addEventListener('icecandidate', (event: any) => {
                if (event.candidate && callIdRef.current && socket?.connected) {
                    socket.emit('call:ice-candidate', {
                        callId: callIdRef.current,
                        candidate: event.candidate.toJSON(),
                    });
                }
            });

            (pc as any).addEventListener('connectionstatechange', () => {
                console.log('[Call] Connection state:', pc.connectionState);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    endCall();
                }
            });

            peerConnectionRef.current = pc;
            return pc;
        },
        []
    );

    // Start duration timer and InCallManager audio session
    const startDurationTimer = useCallback(() => {
        setCallDuration(0);
        durationIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        // Start InCallManager: routes audio to earpiece, enables proximity sensor
        InCallManager?.start({ media: 'audio' });
        InCallManager?.setForceSpeakerphoneOn(false);
    }, []);

    // Initiate a call
    const initiateCall = useCallback(async () => {
        const socket = getSocket();
        if (!socket?.connected || callState !== 'idle') return;

        try {
            // Get audio stream
            const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream as any;

            const pc = createPeerConnection();

            // Add audio tracks to peer connection
            (stream as any).getTracks().forEach((track: any) => {
                pc.addTrack(track, stream as any);
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
                const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream as any;

                iceServersRef.current = incomingData.iceServers;
                const pc = createPeerConnection(incomingData.iceServers);

                (stream as any).getTracks().forEach((track: any) => {
                    pc.addTrack(track, stream as any);
                });

                await pc.setRemoteDescription(new RTCSessionDescription(incomingData.offer as any));

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
        if (callIdRef.current && socket?.connected) {
            socket.emit('call:end', { callId: callIdRef.current });
        }

        cleanupCall();
        setCallState('ended');
        setCallId(null);
        callIdRef.current = null;

        // Reset to idle after a short delay
        setTimeout(() => setCallState('idle'), 2000);
    }, [cleanupCall]);

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

    // Toggle speaker — routes audio between earpiece and loudspeaker
    const toggleSpeaker = useCallback(() => {
        setIsSpeaker((prev) => {
            const newValue = !prev;
            InCallManager?.setForceSpeakerphoneOn(newValue);
            return newValue;
        });
    }, []);

    // Socket event listeners
    useEffect(() => {
        const handleCallInitiated = (data: { callId: string; iceServers?: RTCIceServer[] }) => {
            setCallId(data.callId);
            callIdRef.current = data.callId;
            if (data.iceServers) iceServersRef.current = data.iceServers;
        };

        const handleIncomingCall = (data: IncomingCallData) => {
            if (data.bookingId === bookingId) {
                setCallState('ringing');
                setCallId(data.callId);
                callIdRef.current = data.callId;
                onIncomingCall?.(data);
            }
        };

        const handleCallAnswered = async (data: { callId: string; answer: any }) => {
            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
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
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('[Call] Error adding ICE candidate:', error);
            }
        };

        const handleCallRejected = () => {
            cleanupCall();
            setCallState('ended');
            setCallId(null);
            callIdRef.current = null;
            setTimeout(() => setCallState('idle'), 2000);
        };

        const handleCallEnded = () => {
            cleanupCall();
            setCallState('ended');
            setCallId(null);
            callIdRef.current = null;
            setTimeout(() => setCallState('idle'), 2000);
        };

        const handleCallMissed = () => {
            cleanupCall();
            setCallState('idle');
            setCallId(null);
            callIdRef.current = null;
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
