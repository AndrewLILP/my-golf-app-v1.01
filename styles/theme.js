/**
 * Theme configuration for the Golf Companion app
 * Includes common styles, spacing, typography, and shadows
 */

import colors from './colors';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const theme = {
  // Colors imported from colors.js
  colors,

  // Spacing scale (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      display: 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  // Border radius
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    circle: 9999,
  },

  // Shadows for iOS
  shadowsIOS: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
  },

  // Elevation for Android (corresponds to shadows)
  elevation: {
    small: 2,
    medium: 5,
    large: 10,
  },

  // Screen dimensions and breakpoints
  screen: {
    width,
    height,
    isSmall: width < 375,
    isMedium: width >= 375 && width < 768,
    isLarge: width >= 768,
  },

  // Common component styles
  components: {
    // Card component style
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
    },

    // Input field style
    input: {
      height: 50,
      borderColor: colors.ui.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: colors.background.paper,
    },

    // Button styles
    button: {
      primary: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
      },
      secondary: {
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
      },
      text: {
        color: colors.text.light,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
      },
    },

    // Header styles
    header: {
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
      },
      subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
      },
    },
  },
};

export default theme;