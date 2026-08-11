import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Syntactically valid, non-operational fallbacks let Next.js prerender the UI
// before a developer adds the real Firebase Web App configuration.
const firebaseConfig={apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||"AIzaSy000000000000000000000000000000000",authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||"not-configured.invalid",projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||"not-configured",storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET||"not-configured.invalid",messagingSenderId:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||"000000000000",appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||"1:000000000000:web:0000000000000000000000"};
export const firebaseConfigured=Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY&&process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID&&process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
export const firebaseApp=getApps().length?getApp():initializeApp(firebaseConfig);
export const auth=getAuth(firebaseApp);
export const db=getFirestore(firebaseApp);
export const storage=getStorage(firebaseApp);

// Firebase Auth normally defaults to local persistence in browsers, but making
// it explicit prevents the session from silently falling back to in-memory
// persistence when initialization and sign-in happen at the same time.
export const authPersistenceReady =
  typeof window === "undefined"
    ? Promise.resolve()
    : setPersistence(auth, browserLocalPersistence);
