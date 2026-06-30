import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db };

// Retrieve or create User Profile in Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function createUserProfile(
  uid: string, 
  name: string, 
  email: string, 
  role: UserRole = 'citizen',
  ward: string = 'North Zone - New Delhi'
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    name,
    email,
    role,
    ward,
    points: role === 'official' ? 100 : 0, // officials start with status points, citizens start with 0
    badges: role === 'official' ? ['verified_contributor'] : [],
    streak: 0,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), profile);
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return profile;
  }
}

// Google Sign In with fallback
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = await createUserProfile(
        user.uid, 
        user.displayName || 'Anonymous Citizen', 
        user.email || ''
      );
    }
    
    return { user, profile };
  } catch (error) {
    console.error('Google Sign-In failed or was blocked by iframe/popup restrictions:', error);
    throw error;
  }
}

// Custom simple email auth/signup helpers for smooth demo transitions
export async function registerWithEmail(
  name: string, 
  email: string, 
  role: UserRole, 
  ward: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  // Use a standard password for the simple authentication bypass
  const password = 'CivicPulseDemoPassword123!';
  try {
    // Attempt to register
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const profile = await createUserProfile(result.user.uid, name, email, role, ward);
    return { user: result.user, profile };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // If already registered, login instead and update profile if needed
      const result = await signInWithEmailAndPassword(auth, email, password);
      let profile = await getUserProfile(result.user.uid);
      if (!profile) {
        profile = await createUserProfile(result.user.uid, name, email, role, ward);
      }
      return { user: result.user, profile };
    }
    throw error;
  }
}

// Quick demo sign-in helper
export async function loginDemoUser(role: UserRole): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const demoEmail = role === 'official' 
    ? 'official.sharma@civicpulse.in' 
    : 'citizen.kumar@civicpulse.in';
  
  const demoName = role === 'official' ? 'Officer Suresh Sharma' : 'Rajesh Kumar';
  const demoWard = role === 'official' ? 'South Zone - Bengaluru' : 'North Zone - New Delhi';
  
  return registerWithEmail(demoName, demoEmail, role, demoWard);
}

export async function logoutUser() {
  await signOut(auth);
}
