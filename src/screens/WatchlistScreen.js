import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../services/StorageService';
import SpoilerDetector from '../services/SpoilerDetector';

const WatchlistScreen = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [inputText, setInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadWatchlist = useCallback(async () => {
    const list = await StorageService.getWatchlist();
    setWatchlist(list);
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  }, [loadWatchlist]);

  const addItem = async () => {
    const term = inputText.trim();
    if (!term) {
      Alert.alert('Error', 'Please enter a term to add');
      return;
    }

    const success = await StorageService.addToWatchlist(term);
    if (success) {
      setInputText('');
      await loadWatchlist();
      Alert.alert('Success!', `Added "${term}" to your watchlist`);
    } else {
      Alert.alert('Already Exists', `"${term}" is already in your watchlist`);
    }
  };

  const removeItem = (term) => {
    Alert.alert(
      'Remove Item',
      `Remove "${term}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeFromWatchlist(term);
            await loadWatchlist();
          },
        },
      ]
    );
  };

  const addDefaultTerms = () => {
    Alert.alert(
      'Add Default Terms',
      'Add popular spoiler terms to get started?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Defaults',
          onPress: async () => {
            const defaultTerms = SpoilerDetector.getDefaultWatchlist();
            let addedCount = 0;
            
            for (const term of defaultTerms) {
              const success = await StorageService.addToWatchlist(term);
              if (success) addedCount++;
            }
            
            await loadWatchlist();
            Alert.alert('Success!', `Added ${addedCount} new terms to your watchlist`);
          },
        },
      ]
    );
  };

  const clearAllTerms = () => {
    Alert.alert(
      'Clear All Terms',
      'This will remove ALL terms from your watchlist. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await StorageService.saveWatchlist([]);
            await loadWatchlist();
            Alert.alert('Cleared', 'All terms have been removed');
          },
        },
      ]
    );
  };

  const filteredWatchlist = watchlist.filter(term =>
    term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWatchlistItem = ({ item, index }) => (
    <View style={styles.listItem}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item}</Text>
        <Text style={styles.itemIndex}>#{index + 1}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5722" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="shield-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Terms Added Yet</Text>
      <Text style={styles.emptyDescription}>
        Add spoiler terms to protect yourself from unwanted content
      </Text>
      <TouchableOpacity style={styles.defaultButton} onPress={addDefaultTerms}>
        <Text style={styles.defaultButtonText}>Add Popular Terms</Text>
      </TouchableOpacity>
    </View>
  );

  const quickSuggestions = [
    'Formula 1', 'Marvel', 'Star Wars', 'Game of Thrones',
    'Stranger Things', 'Premier League', 'NBA', 'Netflix'
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {watchlist.length} {watchlist.length === 1 ? 'Term' : 'Terms'} Protected
        </Text>
        {watchlist.length > 0 && (
          <TouchableOpacity onPress={clearAllTerms}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add New Term */}
      <View style={styles.addSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a term to block (e.g., F1, Marvel)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
            onPress={addItem}
            disabled={!inputText.trim()}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Add:</Text>
          <View style={styles.suggestionsRow}>
            {quickSuggestions.slice(0, 4).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setInputText(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Search */}
      {watchlist.length > 5 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your terms..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Watchlist */}
      <FlatList
        data={filteredWatchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearAllText: {
    color: '#FF5722',
    fontWeight: '600',
  },
  addSection: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  suggestionText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemIndex: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  defaultButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  defaultButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WatchlistScreen;