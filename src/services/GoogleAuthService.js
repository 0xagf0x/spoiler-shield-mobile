import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import GoogleSignin from '../config/googleSignIn';
import AsyncStorage from '@react-native-async-storage/async-storage';

class GoogleAuthService {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Check if user is already signed in
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  async signIn() {
    try {
      // Step 1: Google Sign-In
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      // Step 2: Firebase Authentication
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      // Step 3: Store minimal profile locally
      const userProfile = {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photo: result.user.photoURL,
        signedInAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
      this.currentUser = userProfile;
      
      return { success: true, user: userProfile };
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      // Clear Firebase session
      await signOut(auth);
      
      // Clear Google session
      await GoogleSignin.signOut();
      
      // Clear local storage
      await AsyncStorage.removeItem('user_profile');
      this.currentUser = null;
      
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    try {
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    
    return null;
  }

  isSignedIn() {
    return !!this.currentUser;
  }
}

export default new GoogleAuthService();