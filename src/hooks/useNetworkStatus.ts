import { useState, useEffect } from 'react';
// Note: Requires @react-native-community/netinfo to be installed
// npm install @react-native-community/netinfo
// @ts-ignore
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            setIsConnected(!!state.isConnected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return { isConnected };
};
