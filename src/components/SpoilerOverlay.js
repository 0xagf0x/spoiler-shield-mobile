import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 8,
  },
  details: {
    width: '100%',
    marginBottom: 24,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceValue: {
    fontWeight: 'bold',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  termChip: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  termText: {
    fontSize: 12,
    color: '#FF5722',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  keepHiddenButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  revealButton: {
    backgroundColor: '#FF5722',
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
});

export default SpoilerOverlay;