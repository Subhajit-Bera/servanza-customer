export const COLORS = {
    // Primary Brand Colors (Muted Teal / Sage)
    primary: '#47855f',       // muted-teal-600 (Dark enough for crisp white text)
    primaryDark: '#366347',   // muted-teal-700 (For pressed states)
    primaryLight: '#eef6f1',  // muted-teal-50 (For soft backgrounds)

    // Secondary/Accent Colors
    accent: '#E17A5E',        // Warm Rust/Terracotta - a stunning contrast to Teal
    star: '#F59E0B',

    // Neutral Colors (Clean and subtle)
    white: '#FFFFFF',
    background: '#FAFAFA',
    cardBackground: '#FFFFFF',
    inputBackground: '#F4F5F7',
    border: '#deede4',        // muted-teal-100
    divider: '#deede4',       // muted-teal-100

    // Text Colors (Using your deep teal shades instead of harsh black)
    textPrimary: '#122118',   // muted-teal-900 (Rich, almost-black teal)
    textSecondary: '#366347', // muted-teal-700
    textLight: '#7ab892',     // muted-teal-400
    textWhite: '#FFFFFF',

    // Legacy aliases (Mapped safely for backward compatibility)
    coral: '#E17A5E',
    darkGreen: '#366347',
    lightGreen: '#eef6f1',
    offWhite: '#FAFAFA',
    lightGray: '#deede4',
    mediumGray: '#7ab892',
    darkGray: '#366347',
    charcoal: '#122118',

    // Status Colors
    success: '#59a677',       // muted-teal-500
    successLight: '#deede4',  // muted-teal-100
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Transparent
    transparent: 'transparent',
    overlay: 'rgba(18, 33, 24, 0.6)', // muted-teal-900 tinted overlay
    overlayLight: 'rgba(18, 33, 24, 0.3)',
};

export const SHADOWS = {
    // No shadow
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },

    // Light Shadow (cards, inputs)
    light: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },

    // Medium Shadow (modals, floating elements)
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },

    // Heavy Shadow (prominent CTAs)
    heavy: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },

    green: { shadowColor: '#47855f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 5 },

    // Teal Glow (for primary buttons)
    primaryGlow: {
        shadowColor: '#47855f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
};

export const TYPOGRAPHY = {
    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
        display: 28,
        hero: 32,
    },

    // Font weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Preset styles
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 32 * 1.2 },
    h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 28 * 1.2 },
    h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 24 * 1.2 },
    h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 20 * 1.2 },
    subtitle1: { fontSize: 18, fontWeight: '500' as const, lineHeight: 18 * 1.5 },
    subtitle2: { fontSize: 16, fontWeight: '500' as const, lineHeight: 16 * 1.5 },
    body1: { fontSize: 14, fontWeight: '400' as const, lineHeight: 14 * 1.5 },
    body2: { fontSize: 12, fontWeight: '400' as const, lineHeight: 12 * 1.5 },
    caption: { fontSize: 10, fontWeight: '400' as const, lineHeight: 10 * 1.5 },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
};

export const BORDER_RADIUS = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 24,
    pill: 50,
    round: 999,
};

// Common styles
export const COMMON_STYLES = {
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    screenPadding: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.light,
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    button: {
        primary: {
            backgroundColor: COLORS.primary,
            borderRadius: BORDER_RADIUS.xxl,
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.xxl,
            ...SHADOWS.primaryGlow,
            color: COLORS.textWhite, // Explicitly white for clear contrast against the teal
            fontWeight: TYPOGRAPHY.fontWeight.bold,
        },
        secondary: {
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: BORDER_RADIUS.xxl,
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.xxl,
        },
        outline: {
            backgroundColor: COLORS.transparent,
            borderWidth: 1,
            borderColor: COLORS.primary,
            borderRadius: BORDER_RADIUS.xxl,
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.xxl,
        },
    },
    sectionHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    seeAllText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.primary,
    },
};

// Currency helper
export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

export default { COLORS, SHADOWS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES, formatCurrency };
