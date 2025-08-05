import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import GoogleAuthService from '../services/GoogleAuthService';
import GoogleSignInButton from '../components/GoogleSignInButton';
import UserProfile from '../components/UserProfile';

const AuthTestScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const currentUser = await GoogleAuthService.getCurrentUser();
    setUser(currentUser);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const result = await GoogleAuthService.signIn();
    
    if (result.success) {
      setUser(result.user);
      Alert.alert('Success', 'Signed in successfully!');
    } else {
      Alert.alert('Sign In Failed', result.error);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const result = await GoogleAuthService.signOut();
    if (result.success) {
      setUser(null);
      Alert.alert('Success', 'Signed out successfully!');
    } else {
      Alert.alert('Sign Out Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <UserProfile user={user} onSignOut={handleSignOut} />
      ) : (
        <GoogleSignInButton onPress={handleSignIn} loading={loading} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
});

export default AuthTestScreen;