import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  Auth,
  User
} from 'firebase/auth';
import { getFirestore, Firestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("AUTH DOMAIN:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("PROJECT ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

console.log("import.meta.env =", import.meta.env);
console.log("VITE_FIREBASE_API_KEY =", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("MODE =", import.meta.env.MODE);

// Check if all essential keys exist
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    db = getFirestore(app);

    auth = getAuth(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    console.log('🏟️ ArenaFlow: Firebase Authentication successfully initialized.');
  } catch (error) {
    console.error('⚠️ ArenaFlow: Failed to initialize Firebase App:', error);
  }
} else {
  console.warn(
    '💡 ArenaFlow: Firebase API keys not detected in environment variables. Operating in Hybrid Mode with premium Local Auth simulation.'
  );
}

export { auth, googleProvider, db };

/**
 * Validate current Firebase configuration keys and format
 */
function checkConfigurationValidity(): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!firebaseConfig.apiKey) {
    reasons.push('VITE_FIREBASE_API_KEY is missing or empty.');
  }
  if (!firebaseConfig.authDomain) {
    reasons.push('VITE_FIREBASE_AUTH_DOMAIN is missing or empty.');
  } else if (
    !firebaseConfig.authDomain.endsWith('.firebaseapp.com') &&
    !firebaseConfig.authDomain.endsWith('.web.app') &&
    !firebaseConfig.authDomain.includes('localhost')
  ) {
    reasons.push(`VITE_FIREBASE_AUTH_DOMAIN (${firebaseConfig.authDomain}) is potentially malformed (standard domains end with .firebaseapp.com or .web.app).`);
  }
  if (!firebaseConfig.projectId) {
    reasons.push('VITE_FIREBASE_PROJECT_ID is missing or empty.');
  }
  if (!firebaseConfig.appId) {
    reasons.push('VITE_FIREBASE_APP_ID is missing or empty.');
  }
  return {
    valid: reasons.length === 0,
    reasons
  };
}

/**
 * Log comprehensive system telemetry and authentication parameters before operations
 */
export function logAuthenticationDiagnostics(stepName: string) {
  console.log(`=== TELEMETRY: DIAGNOSTIC REPORT BEFORE STEP [${stepName}] ===`);
  
  // 1. Firebase configuration values (excluding secrets)
  const safeConfig = {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}... (length: ${firebaseConfig.apiKey.length})` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId || 'MISSING'
  };
  console.log('Firebase Configuration (excluding secrets):', JSON.stringify(safeConfig, null, 2));

  // 2. Whether initializeApp() succeeded
  const apps = getApps();
  const initSucceeded = apps.length > 0;
  console.log(`Whether initializeApp() succeeded: ${initSucceeded} (Initialized apps count: ${apps.length})`);

  // 3. Current authDomain
  console.log(`Current authDomain: ${firebaseConfig.authDomain || 'undefined'}`);

  // 4. Current projectId
  console.log(`Current projectId: ${firebaseConfig.projectId || 'undefined'}`);

  // 5. Current window.location.origin
  console.log(`Current window.location.origin: ${window.location.origin}`);

  // 6. Current hostname
  console.log(`Current hostname: ${window.location.hostname}`);

  // 7. Whether GoogleAuthProvider exists
  console.log(`Whether GoogleAuthProvider exists: ${typeof GoogleAuthProvider !== 'undefined'}`);
  console.log(`Whether googleProvider instance exists: ${!!googleProvider}`);

  // 8. Whether auth.currentUser exists
  console.log(`Whether auth.currentUser exists: ${!!auth?.currentUser} (UID: ${auth?.currentUser?.uid || 'none'})`);

  // If configuration is invalid, explain why
  const configCheck = checkConfigurationValidity();
  if (!configCheck.valid) {
    console.error('⚠️ CONFIGURATION INVALID REASONS:', configCheck.reasons.join('\n'));
  } else {
    console.log('✅ Configuration basic format appears valid.');
  }
  console.log(`=== END OF PRE-STEP DIAGNOSTICS FOR [${stepName}] ===`);
}

/**
 * Trigger authentic Google Sign-In with Popup
 */
export async function signInWithGoogle(): Promise<User> {
  let currentStage = 'Stage 1: Pre-flight validation';
  
  logAuthenticationDiagnostics('signInWithGoogle');

  try {
    if (!auth || !googleProvider) {
      const explainError = `Firebase Auth is not configured. Details:\n` +
        `- auth instance: ${auth ? 'exists' : 'null'}\n` +
        `- googleProvider instance: ${googleProvider ? 'exists' : 'null'}\n` +
        `Please check if VITE_FIREBASE_* variables are set correctly in your environment.`;
      console.error(`[Failure at ${currentStage}] ${explainError}`);
      throw new Error(explainError);
    }

    currentStage = 'Stage 2: Initializing OAuth Popup with Firebase SDK';
    console.log(`[Transition] Entering ${currentStage}...`);

    const result = await signInWithPopup(auth, googleProvider);

    currentStage = 'Stage 3: Resolving user credentials';
    console.log(`[Transition] Entering ${currentStage} (Popup returned successfully)...`);
    
    if (!result.user) {
      throw new Error('OAuth completed but user object is empty/null.');
    }

    console.log(`🏟️ ArenaFlow: ${currentStage} completed. User logged in successfully:`, result.user.uid);
    return result.user;

  } catch (error: any) {
    console.error(`❌ [AUTHENTICATION FAILURE at ${currentStage}]`);
    
    // Extract exact Firebase error code
    const errCode = error?.code || 'NO_FIREBASE_CODE';
    console.error(`- Exact Firebase error code: ${errCode}`);
    
    // Log complete error object
    console.error(`- Complete error object:`, error);
    try {
      console.error(`- Complete error object (JSON serialized):`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (serializeErr) {
      console.error(`- Failed to serialize error object:`, serializeErr);
    }

    // Log the stack trace
    console.error(`- Stack trace:\n${error?.stack || 'No stack trace available'}`);

    // If configuration is invalid, explain why (again, in error block)
    const configCheck = checkConfigurationValidity();
    if (!configCheck.valid) {
      console.error(`- Config Invalid Reasons:\n${configCheck.reasons.join('\n')}`);
    }

    // Do not suppress errors. Do not catch errors without logging them.
    throw error;
  }
}

/**
 * Sign out of current Firebase Session
 */
export async function signOut(): Promise<void> {
  logAuthenticationDiagnostics('signOut');
  if (auth) {
    try {
      await firebaseSignOut(auth);
      console.log('🏟️ ArenaFlow: Sign out successful.');
    } catch (error: any) {
      console.error('❌ [SIGN OUT FAILURE]');
      console.error(`- Exact Firebase error code: ${error?.code || 'NO_FIREBASE_CODE'}`);
      console.error(`- Complete error object:`, error);
      console.error(`- Stack trace:\n${error?.stack || 'No stack trace available'}`);
      throw error;
    }
  }
}
