import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import SpoilerOverlay from './SpoilerOverlay';
import SpoilerDetector from '../services/SpoilerDetector';
import { BrandColors } from "../constants/Colors";


const ProtectedWebView = ({ url, onLoadStart, onLoadEnd }) => {
  const [showSpoilerOverlay, setShowSpoilerOverlay] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef(null);

  // JavaScript to inject into web pages for content scanning
  const injectedJavaScript = `
    (function() {
      // Function to extract text content from the page
      function extractPageContent() {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Get main content areas (common selectors for articles, posts, etc.)
        const contentSelectors = [
          'article', 'main', '[role="main"]', '.content', '.post', 
          '.entry', '.article', '.story', '.tweet', '.post-content'
        ];
        
        let content = '';
        
        // Try to get content from specific areas first
        for (const selector of contentSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach(el => {
              content += ' ' + el.textContent;
            });
            break; // Use first matching selector type
          }
        }
        
        // Fallback to body content if no specific areas found
        if (!content.trim()) {
          content = document.body.textContent || '';
        }
        
        // Clean up the text
        return content
          .replace(/\\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to 5000 chars for performance
      }
      
      // Extract content when page loads
      function checkContent() {
        const content = extractPageContent();
        const url = window.location.href;
        const title = document.title;
        
        // Send content to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CONTENT_EXTRACTED',
          content: content,
          url: url,
          title: title
        }));
      }
      
      // Check content when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkContent);
      } else {
        checkContent();
      }
      
      // Also check when content changes (for SPAs)
      let lastContent = '';
      setInterval(() => {
        const currentContent = extractPageContent();
        if (currentContent !== lastContent && currentContent.length > 100) {
          lastContent = currentContent;
          checkContent();
        }
      }, 2000);
      
      true; // Required for injected JS
    })();
  `;

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'CONTENT_EXTRACTED') {
        const { content, url, title } = data;
        
        if (content && content.length > 50) {
          // Analyze content for spoilers
          const result = await SpoilerDetector.analyzeText(content);
          
          if (result.hasSpoiler && result.confidence > 0.5) {
            setDetectionResult({
              ...result,
              url,
              title,
              content: content.substring(0, 200) + '...'
            });
            setShowSpoilerOverlay(true);
          }
        }
      }
    } catch (error) {
      console.error('Error processing WebView message:', error);
    }
  };

  const handleRevealContent = () => {
    setShowSpoilerOverlay(false);
    setDetectionResult(null);
  };

  const handleKeepHidden = () => {
    setShowSpoilerOverlay(false);
    setDetectionResult(null);
    
    // Go back or show safe page
    Alert.alert(
      'Content Hidden',
      'The page has been hidden to protect you from spoilers. You can navigate to a different page.',
      [
        { text: 'OK' },
        { 
          text: 'Go to Safe Page', 
          onPress: () => {
            webViewRef.current?.loadWithUrl('https://www.google.com');
          }
        }
      ]
    );
  };

  const handleLoadStart = (navState) => {
    setIsLoading(true);
    setShowSpoilerOverlay(false);
    setDetectionResult(null);
    onLoadStart?.(navState);
  };

  const handleLoadEnd = (navState) => {
    setIsLoading(false);
    onLoadEnd?.(navState);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Loading Error',
      'Failed to load the webpage. Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        decelerationRate="normal"
        onShouldStartLoadWithRequest={(request) => {
          // Allow all requests for now
          return true;
        }}
      />
      
      <SpoilerOverlay
        visible={showSpoilerOverlay}
        matchedTerms={detectionResult?.matchedTerms || []}
        confidence={detectionResult?.confidence || 0}
        onReveal={handleRevealContent}
        onKeepHidden={handleKeepHidden}
      />
    </View>
  );
};

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
});

export default ProtectedWebView;