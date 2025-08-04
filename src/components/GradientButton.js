import { LinearGradient } from 'expo-linear-gradient';


export const GradientButton = ({ onPress, children, style, textStyle }) => (
  <TouchableOpacity onPress={onPress} style={style}>
    <LinearGradient
      colors={[BrandColors.gradientStart, BrandColors.gradientEnd]}
      style={styles.gradientButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[styles.gradientButtonText, textStyle]}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradientButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});