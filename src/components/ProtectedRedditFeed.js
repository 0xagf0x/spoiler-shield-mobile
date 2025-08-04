import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RedditAPI from '../services/RedditAPI';
import MLEngine from '../services/MLEngine';
import SpoilerOverlay from './SpoilerOverlay';

const { width: screenWidth } = Dimensions.get('window');

const ProtectedRedditFeed = ({ subreddit = 'all', sort = 'hot' }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [after, setAfter] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [spoilerStates, setSpoilerStates] = useState({});
  
  const flatListRef = useRef(null);

  useEffect(() => {
    loadInitialPosts();
  }, [subreddit, sort]);

  const loadInitialPosts = async () => {
    setLoading(true);
    setError(null);
    setPosts([]);
    setAfter(null);
    setSpoilerStates({});
    
    try {
      await MLEngine.initialize();
      const response = await RedditAPI.getSubredditPosts(subreddit, sort, 25);
      
      // Analyze posts for spoilers
      const analyzedPosts = await analyzePosts(response.posts);
      
      setPosts(analyzedPosts);
      setAfter(response.after);
      setHasMore(!!response.after);
    } catch (err) {
      setError(err.message);
      console.error('[ProtectedRedditFeed] Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || loading) return;

    try {
      const response = await RedditAPI.getSubredditPosts(subreddit, sort, 25, after);
      const analyzedPosts = await analyzePosts(response.posts);
      
      setPosts(prev => [...prev, ...analyzedPosts]);
      setAfter(response.after);
      setHasMore(!!response.after);
    } catch (err) {
      console.error('[ProtectedRedditFeed] Failed to load more posts:', err);
    }
  };

  const analyzePosts = async (postList) => {
    const analyzedPosts = [];
    
    for (const post of postList) {
      try {
        // Analyze title and content for spoilers
        const titleAnalysis = await MLEngine.analyzeText(
          post.title, 
          { type: 'title', subreddit: post.subreddit }
        );
        
        let bodyAnalysis = { hasSpoiler: false, confidence: 0, matchedTerms: [] };
        if (post.selfText) {
          bodyAnalysis = await MLEngine.analyzeText(
            post.selfText,
            { type: 'body', subreddit: post.subreddit }
          );
        }

        // Combine analyses
        const combinedAnalysis = combineAnalyses(titleAnalysis, bodyAnalysis);
        
        analyzedPosts.push({
          ...post,
          spoilerAnalysis: combinedAnalysis,
          isProtected: combinedAnalysis.hasSpoiler && combinedAnalysis.confidence > 0.3
        });
      } catch (error) {
        console.error('[ProtectedRedditFeed] Analysis failed for post:', post.id, error);
        analyzedPosts.push({
          ...post,
          spoilerAnalysis: { hasSpoiler: false, confidence: 0, matchedTerms: [] },
          isProtected: false
        });
      }
    }
    
    return analyzedPosts;
  };

  const combineAnalyses = (titleAnalysis, bodyAnalysis) => {
    const maxConfidence = Math.max(titleAnalysis.confidence, bodyAnalysis.confidence);
    const allTerms = [...titleAnalysis.matchedTerms, ...bodyAnalysis.matchedTerms];
    const uniqueTerms = [...new Set(allTerms)];
    
    return {
      hasSpoiler: titleAnalysis.hasSpoiler || bodyAnalysis.hasSpoiler,
      confidence: maxConfidence,
      matchedTerms: uniqueTerms,
      titleAnalysis,
      bodyAnalysis
    };
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialPosts();
    setRefreshing(false);
  }, [subreddit, sort]);

  const revealPost = (postId) => {
    setSpoilerStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], revealed: true }
    }));
  };

  const hidePost = (postId) => {
    setSpoilerStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], hidden: true }
    }));
  };

  const openPost = async (post) => {
    try {
      await Linking.openURL(post.permalink);
    } catch (error) {
      Alert.alert('Error', 'Could not open post');
    }
  };

  const formatScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
  };

  const renderPost = ({ item: post }) => {
    const spoilerState = spoilerStates[post.id] || {};
    const shouldShowSpoilerOverlay = post.isProtected && !spoilerState.revealed && !spoilerState.hidden;

    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Text style={styles.subredditName}>r/{post.subreddit}</Text>
          <Text style={styles.postMeta}>
            u/{post.author} • {formatTime(post.created)}
          </Text>
          {post.flair && (
            <View style={styles.flairContainer}>
              <Text style={styles.flairText}>{post.flair}</Text>
            </View>
          )}
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {shouldShowSpoilerOverlay ? (
            <SpoilerOverlay
              visible={true}
              matchedTerms={post.spoilerAnalysis.matchedTerms}
              confidence={post.spoilerAnalysis.confidence}
              onReveal={() => revealPost(post.id)}
              onKeepHidden={() => hidePost(post.id)}
              style={styles.postSpoilerOverlay}
            />
          ) : (
            <>
              {/* Title */}
              <TouchableOpacity onPress={() => openPost(post)}>
                <Text style={styles.postTitle} numberOfLines={3}>
                  {post.title}
                </Text>
              </TouchableOpacity>

              {/* Content Preview */}
              {post.selfText ? (
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.selfText}
                </Text>
              ) : null}

              {/* Media */}
              {post.media.type === 'image' && post.media.thumbnail && (
                <Image 
                  source={{ uri: post.media.thumbnail }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {post.media.type === 'link' && (
                <View style={styles.linkPreview}>
                  <Ionicons name="link" size={16} color="#666" />
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {post.url}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Post Footer */}
        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <View style={styles.statItem}>
              <Ionicons name="arrow-up" size={16} color="#FF4500" />
              <Text style={styles.statText}>{formatScore(post.score)}</Text>
            </View>
            
            <TouchableOpacity style={styles.statItem} onPress={() => openPost(post)}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <Text style={styles.statText}>{post.numComments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem}>
              <Ionicons name="share-outline" size={16} color="#666" />
            </TouchableOpacity>

            {post.isProtected && (
              <View style={styles.protectedBadge}>
                <Ionicons name="shield" size={14} color="#4CAF50" />
                <Text style={styles.protectedText}>Protected</Text>
              </View>
            )}
          </View>

          {/* Spoiler Analysis Debug Info (can be removed in production) */}
          {post.spoilerAnalysis.hasSpoiler && (
            <Text style={styles.debugText}>
              Confidence: {Math.round(post.spoilerAnalysis.confidence * 100)}% 
              {post.spoilerAnalysis.matchedTerms.length > 0 && 
                ` • Terms: ${post.spoilerAnalysis.matchedTerms.join(', ')}`
              }
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderLoadingFooter = () => {
    if (!loading || posts.length === 0) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Posts Found</Text>
      <Text style={styles.emptyDescription}>
        {error ? error : 'Try refreshing or checking your connection'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadInitialPosts}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading protected feed...</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      onEndReached={loadMorePosts}
      onEndReachedThreshold={0.1}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListFooterComponent={renderLoadingFooter}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  postContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  postHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subredditName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 12,
    color: '#666',
  },
  flairContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  flairText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '500',
  },
  contentContainer: {
    position: 'relative',
    minHeight: 80,
  },
  postSpoilerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    padding: 16,
    paddingBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkUrl: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  postFooter: {
    padding: 16,
    paddingTop: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  protectedText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProtectedRedditFeed;