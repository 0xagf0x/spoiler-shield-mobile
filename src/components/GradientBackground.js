import { LinearGradient } from 'expo-linear-gradient';

export const GradientBackground = ({ children, style }) => (
  <LinearGradient
    colors={[BrandColors.gradientStart, BrandColors.gradientEnd]}
    style={[{ flex: 1 }, style]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    {children}
  </LinearGradient>
);