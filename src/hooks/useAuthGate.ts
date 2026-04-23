/**
 * useAuthGate — Intercepts protected actions for guest users.
 *
 * Usage:
 *   const { requireAuth } = useAuthGate();
 *   requireAuth(() => doSomething(), 'ScreenName');
 *
 * When a guest calls requireAuth:
 *  1. Saves the pendingAction in Redux
 *  2. Dispatches clearGuest() → isGuest becomes false
 *  3. Root navigator automatically switches to the Auth screen
 *     (no navigate() call needed — conditional rendering does it)
 *
 * After a successful login, the RootNavigator will switch back to Main
 * and the screen that triggered the action should call usePendingAction
 * to replay it.
 */
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPendingAction, clearGuest } from '../store/slices/authSlice';

export const useAuthGate = () => {
    const { isAuthenticated, isGuest } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    /**
     * requireAuth — runs `action` immediately if authenticated,
     * otherwise stores it as a pending action and navigates to login
     * by clearing guest mode (root navigator auto-shows Auth).
     */
    const requireAuth = useCallback(
        (
            action: () => void,
            screenName: string,
            params?: any,
        ) => {
            if (isAuthenticated && !isGuest) {
                // User is logged in — run directly
                action();
                return;
            }

            // Guest — save what they wanted to do and redirect to Auth
            dispatch(setPendingAction({ screen: screenName, params }));
            // Setting isGuest=false makes showMain=false in App.tsx
            // so the root navigator automatically renders the Auth screen
            dispatch(clearGuest());
        },
        [isAuthenticated, isGuest, dispatch],
    );

    const isGuestUser = isGuest && !isAuthenticated;

    return { requireAuth, isGuestUser };
};

/**
 * usePendingAction — After login completes, checks if there is a pending
 * action stored in Redux state and executes the provided handler for it.
 *
 * Put this in screens that can be "called back" after login.
 */
export const usePendingAction = (
    handlers: Record<string, (params?: any) => void>,
) => {
    const { pendingAction } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    const replayPendingAction = useCallback(() => {
        if (!pendingAction) return;
        const handler = handlers[pendingAction.screen];
        if (handler) {
            handler(pendingAction.params);
            dispatch(setPendingAction(null));
        }
    }, [pendingAction, handlers, dispatch]);

    return { pendingAction, replayPendingAction };
};
