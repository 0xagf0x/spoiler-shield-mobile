import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Replace with YOUR Web Client ID from Step 5
GoogleSignin.configure({
  webClientId: '880723151238-6nj3ujtvlra01g72l3kgacotck6nc5em.apps.googleusercontent.com',
  offlineAccess: true,
});

export default GoogleSignin;