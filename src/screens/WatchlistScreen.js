import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WatchlistScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Watchlist</Text>
      <Text style={styles.description}>Manage your spoiler terms here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default WatchlistScreen;