# AI Trade Journal

Next.js + TypeScript + Firebase MVP for manually journaling trades or turning natural-language notes into a reviewable draft with Firebase AI Logic.

## Local setup

1. Copy `.env.local.example` to `.env.local` and paste the Firebase Web App configuration values from Firebase Console.
2. In Firebase Authentication, enable Email/Password.
3. Create Cloud Firestore, then deploy `firestore.rules` and `firestore.indexes.json` with the Firebase CLI.
4. In **AI Services → AI Logic**, choose the Gemini Developer API and complete setup.
5. Configure Firebase App Check. For local development, register the debug token printed by the SDK/browser; for production, register a web attestation provider.
6. Run `npm install`, then `npm run dev`.

The default AI model is `gemini-3.6-flash`; override it with `NEXT_PUBLIC_FIREBASE_AI_MODEL`.

AI extraction never saves directly. It populates the shared editable form, and Firestore is written only after the authenticated user clicks **Save trade**.
