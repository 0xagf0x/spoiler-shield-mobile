import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProtectedWebView from '../components/ProtectedWebView';

const BrowserScreen = () => {
  const [url, setUrl] = useState('https://www.reddit.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.reddit.com');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = useRef(null);

  const popularSites = [
    { name: 'Reddit', url: 'https://www.reddit.com', icon: 'logo-reddit' },
    { name: 'Twitter', url: 'https://twitter.com', icon: 'logo-twitter' },
    { name: 'YouTube', url: 'https://www.youtube.com', icon: 'logo-youtube' },
    { name: 'Google', url: 'https://www.google.com', icon: 'search' },
  ];

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // Check if it might be a domain without protocol
      if (string.includes('.') && !string.includes(' ')) {
        return true;
      }
      return false;
    }
  };

  const formatUrl = (input) => {
    if (!input) return '';
    
    // If it already has a protocol, use as-is
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return input;
    }
    
    // If it looks like a domain, add https://
    if (input.includes('.') && !input.includes(' ')) {
      return `https://${input}`;
    }
    
    // Otherwise, search Google
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  };

  const handleNavigate = () => {
    const formattedUrl = formatUrl(url);
    setCurrentUrl(formattedUrl);
  };

  const handleQuickNavigation = (siteUrl) => {
    setUrl(siteUrl);
    setCurrentUrl(siteUrl);
  };

  const handleLoadStart = (navState) => {
    setIsLoading(true);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setUrl(navState.url);
  };

  const handleLoadEnd = (navState) => {
    setIsLoading(false);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setUrl(navState.url);
  };

  const handleGoBack = () => {
    webViewRef.current?.goBack();
  };

  const handleGoForward = () => {
    webViewRef.current?.goForward();
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const showInfo = () => {
    Alert.alert(
      'Protected Browsing',
      'This browser automatically scans web pages for spoilers based on your watchlist. When spoilers are detected, you\'ll see an overlay asking if you want to view the content.\n\nYour browsing data stays private and is only used for spoiler detection.',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Header with URL bar */}
      <View style={styles.header}>
        <View style={styles.urlContainer}>
          <TextInput
            style={styles.urlInput}
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={handleNavigate}
            placeholder="Enter URL or search..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
          />
          <TouchableOpacity style={styles.goButton} onPress={handleNavigate}>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.infoButton} onPress={showInfo}>
          <Ionicons name="information-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Navigation controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, !canGoBack && styles.disabledButton]} 
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={canGoBack ? "#007AFF" : "#ccc"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, !canGoForward && styles.disabledButton]} 
          onPress={handleGoForward}
          disabled={!canGoForward}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={canGoForward ? "#007AFF" : "#ccc"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color="#007AFF" 
            style={styles.loadingIndicator} 
          />
        )}
        
        <Text style={styles.protectedLabel}>🛡️ Protected</Text>
      </View>

      {/* Quick navigation */}
      <View style={styles.quickNav}>
        {popularSites.map((site) => (
          <TouchableOpacity
            key={site.name}
            style={styles.quickNavButton}
            onPress={() => handleQuickNavigation(site.url)}
          >
            <Ionicons name={site.icon} size={20} color="#007AFF" />
            <Text style={styles.quickNavText}>{site.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* WebView */}
      <ProtectedWebView
        ref={webViewRef}
        url={currentUrl}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  urlContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 12,
  },
  urlInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  goButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  controlButton: {
    padding: 8,
    marginRight: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginRight: 12,
  },
  protectedLabel: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickNavText: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BrowserScreen;