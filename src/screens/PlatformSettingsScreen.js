/**
 * Platform Settings Screen for Spoiler Shield Mobile
 * Allows users to configure and manage social media platform integrations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlatformManager from '../services/PlatformManager';

const PlatformSettingsScreen = ({ navigation }) => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadPlatformStatus();
  }, []);

  const loadPlatformStatus = async () => {
    try {
      const status = PlatformManager.getPlatformStatus();
      setPlatforms(status);
    } catch (error) {
      console.error('Failed to load platform status:', error);
      Alert.alert('Error', 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = async (platformId, enabled) => {
    try {
      await PlatformManager.setPlatformEnabled(platformId, enabled);
      setPlatforms(prev => 
        prev.map(p => 
          p.id === platformId ? { ...p, enabled } : p
        )
      );
    } catch (error) {
      console.error('Failed to toggle platform:', error);
      Alert.alert('Error', 'Failed to update platform settings');
    }
  };

  const openConfigModal = (platform) => {
    setSelectedPlatform(platform);
    setCredentials({});
    setConfigModalVisible(true);
  };

  const closeConfigModal = () => {
    setConfigModalVisible(false);
    setSelectedPlatform(null);
    setCredentials({});
  };

  const savePlatformConfig = async () => {
    if (!selectedPlatform) return;

    try {
      setTestingConnection(true);
      
      await PlatformManager.configurePlatform(selectedPlatform.id, credentials);
      
      // Test the connection
      const isConnected = await PlatformManager.testPlatformConnection(selectedPlatform.id);
      
      if (isConnected) {
        Alert.alert('Success', `${selectedPlatform.name} configured successfully!`, [
          { text: 'OK', onPress: () => {
            closeConfigModal();
            loadPlatformStatus();
          }}
        ]);
      } else {
        Alert.alert('Warning', `${selectedPlatform.name} configured but connection test failed. Please verify your credentials.`);
      }
    } catch (error) {
      console.error('Failed to configure platform:', error);
      Alert.alert('Error', `Failed to configure ${selectedPlatform.name}: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const testPlatformConnection = async (platform) => {
    try {
      setTestingConnection(true);
      const isConnected = await PlatformManager.testPlatformConnection(platform.id);
      
      Alert.alert(
        'Connection Test',
        isConnected 
          ? `✅ ${platform.name} connection successful!`
          : `❌ ${platform.name} connection failed. Please check your credentials.`
      );
    } catch (error) {
      Alert.alert('Error', `Connection test failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const getCredentialFields = (platformId) => {
    switch (platformId) {
      case 'reddit':
        return [
          { key: 'clientId', label: 'Client ID', placeholder: 'Your Reddit app client ID', secure: false },
          { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Reddit app client secret', secure: true }
        ];
      case 'twitter':
        return [
          { key: 'bearerToken', label: 'Bearer Token', placeholder: 'Your Twitter API bearer token', secure: true }
        ];
      case 'youtube':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your YouTube Data API key', secure: true }
        ];
      case 'facebook':
        return [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Your Facebook app access token', secure: true }
        ];
      case 'instagram':
        return [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Your Instagram Basic Display access token', secure: true }
        ];
      default:
        return [];
    }
  };

  const getSetupInstructions = (platformId) => {
    const instructions = {
      reddit: {
        title: 'Reddit API Setup',
        steps: [
          '1. Go to https://www.reddit.com/prefs/apps',
          '2. Click "Create App" or "Create Another App"',
          '3. Choose "script" type',
          '4. Copy your Client ID and Secret'
        ],
        helpUrl: 'https://github.com/reddit-archive/reddit/wiki/OAuth2'
      },
      twitter: {
        title: 'Twitter API Setup',
        steps: [
          '1. Go to https://developer.twitter.com',
          '2. Create a new app or use existing',
          '3. Generate Bearer Token in "Keys and Tokens"',
          '4. Copy the Bearer Token'
        ],
        helpUrl: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0'
      },
      youtube: {
        title: 'YouTube API Setup',
        steps: [
          '1. Go to Google Cloud Console',
          '2. Enable YouTube Data API v3',
          '3. Create credentials (API Key)',
          '4. Copy the API Key'
        ],
        helpUrl: 'https://developers.google.com/youtube/v3/getting-started'
      },
      facebook: {
        title: 'Facebook API Setup',
        steps: [
          '1. Go to https://developers.facebook.com',
          '2. Create a new app',
          '3. Add Facebook Login product',
          '4. Generate User Access Token'
        ],
        helpUrl: 'https://developers.facebook.com/docs/facebook-login'
      },
      instagram: {
        title: 'Instagram API Setup',
        steps: [
          '1. Go to https://developers.facebook.com',
          '2. Create app with Instagram Basic Display',
          '3. Generate User Access Token',
          '4. Copy the Access Token'
        ],
        helpUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api'
      }
    };

    return instructions[platformId] || { title: 'Setup Instructions', steps: [], helpUrl: '' };
  };

  const renderPlatformItem = (platform) => (
    <View key={platform.id} style={styles.platformItem}>
      <View style={styles.platformHeader}>
        <View style={styles.platformInfo}>
          <Ionicons 
            name={platform.icon} 
            size={24} 
            color={platform.color} 
          />
          <Text style={styles.platformName}>{platform.name}</Text>
          {platform.configured ? (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          ) : (
            <Ionicons name="alert-circle" size={16} color="#FF9800" />
          )}
        </View>
        <Switch
          value={platform.enabled && platform.configured}
          onValueChange={(enabled) => togglePlatform(platform.id, enabled)}
          disabled={!platform.configured}
          trackColor={{ false: '#767577', true: platform.color }}
          thumbColor={platform.enabled ? '#fff' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.platformActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.configureButton]}
          onPress={() => openConfigModal(platform)}
        >
          <Ionicons name="settings" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>
            {platform.configured ? 'Reconfigure' : 'Configure'}
          </Text>
        </TouchableOpacity>
        
        {platform.configured && (
          <TouchableOpacity
            style={[styles.actionButton, styles.testButton]}
            onPress={() => testPlatformConnection(platform)}
            disabled={testingConnection}
          >
            <Ionicons name="wifi" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Test</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderConfigModal = () => {
    if (!selectedPlatform) return null;

    const fields = getCredentialFields(selectedPlatform.id);
    const instructions = getSetupInstructions(selectedPlatform.id);

    return (
      <Modal
        visible={configModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeConfigModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configure {selectedPlatform.name}</Text>
            <TouchableOpacity
              onPress={savePlatformConfig}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>{instructions.title}</Text>
              {instructions.steps.map((step, index) => (
                <Text key={index} style={styles.instructionStep}>{step}</Text>
              ))}
              {instructions.helpUrl && (
                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() => Linking.openURL(instructions.helpUrl)}
                >
                  <Ionicons name="help-circle" size={16} color="#667eea" />
                  <Text style={styles.helpButtonText}>View Documentation</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.credentialsSection}>
              <Text style={styles.sectionTitle}>API Credentials</Text>
              {fields.map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ''}
                    onChangeText={(text) => setCredentials(prev => ({
                      ...prev,
                      [field.key]: text
                    }))}
                    secureTextEntry={field.secure}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading platform settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Platform Integrations</Text>
          <Text style={styles.subtitle}>
            Configure social media platforms and news sources for spoiler protection
          </Text>
        </View>

        <View style={styles.platformList}>
          {platforms.map(renderPlatformItem)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Enable platforms to get spoiler-protected feeds from multiple sources.
            Each platform requires API credentials for access.
          </Text>
        </View>
      </ScrollView>

      {renderConfigModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  platformList: {
    padding: 20,
  },
  platformItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    marginRight: 8,
  },
  platformActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  configureButton: {
    backgroundColor: '#667eea',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  instructionsSection: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 10,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  credentialsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PlatformSettingsScreen;