import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from "../constants/Colors";


const SpoilerOverlay = ({ 
  visible, 
  matchedTerms, 
  confidence, 
  onReveal, 
  onKeepHidden 
}) => {
  if (!visible) return null;

  const confidenceColor = confidence > 0.8 ? '#FF5722' : confidence > 0.6 ? '#FF9800' : '#FFC107';
  const confidenceText = confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low';

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-outline" size={32} color="#FF5722" />
          <Text style={styles.title}>Spoiler Detected!</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.confidence}>
            Confidence: <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
              {confidenceText} ({Math.round(confidence * 100)}%)
            </Text>
          </Text>
          
          {matchedTerms.length > 0 && (
            <View style={styles.termsContainer}>
              <Text style={styles.termsLabel}>Matched terms:</Text>
              {matchedTerms.slice(0, 3).map((term, index) => (
                <View key={index} style={styles.termChip}>
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
              {matchedTerms.length > 3 && (
                <Text style={styles.moreTerms}>+{matchedTerms.length - 3} more</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.keepHiddenButton]} 
            onPress={onKeepHidden}
          >
            <Ionicons name="eye-off-outline" size={20} color="#666" />
            <Text style={styles.keepHiddenText}>Keep Hidden</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.revealButton]} 
            onPress={onReveal}
          >
            <Ionicons name="eye-outline" size={20} color="white" />
            <Text style={styles.revealText}>Show Content</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.disclaimer}>
          This content may contain spoilers related to your watchlist
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
   overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.95)', // Dark overlay with brand color tint
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: BrandColors.cardBackground,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: BrandColors.border,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
 title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.textPrimary,
    marginLeft: 12,
  },
  details: {
    width: '100%',
    marginBottom: 24,
  },
confidence: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  confidenceValue: {
    fontWeight: 'bold',
  },
  termsContainer: {
    alignItems: 'center',
  },
   termsLabel: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  termChip: {
    backgroundColor: BrandColors.overlayBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
 termText: {
    color: BrandColors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  moreTerms: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
 button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  keepHiddenButton: {
    backgroundColor: BrandColors.error,
    shadowColor: BrandColors.error,
  },
  revealButton: {
    backgroundColor: BrandColors.success,
    shadowColor: BrandColors.success,
  },
  keepHiddenText: {
    color: '#666',
    fontWeight: '600',
  },
  revealText: {
    color: 'white',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 14,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SpoilerOverlay;