# Journal Trade

Next.js + TypeScript + Firebase application for recording trades, reviewing performance, and maintaining a private trading journal.

## Local setup

1. Copy `.env.example` to `.env.local` and paste the Firebase Web App configuration values from Firebase Console.
2. In Firebase Authentication, enable Email/Password.
3. Create Cloud Firestore and Firebase Storage.
4. Deploy the included Firestore and Storage rules with `firebase deploy --only firestore,storage`.
5. Configure Firebase App Check before enforcing it for production services.
6. Run `npm install`, then `npm run dev`.

## Gemini trading coach

1. Create a Gemini API key in Google AI Studio.
2. Add it to `.env.local` as `GEMINI_API_KEY=your_key_here`.
3. Restart the app after changing environment variables.

`GEMINI_API_KEY` is server-only. Never rename it to `NEXT_PUBLIC_GEMINI_API_KEY` or commit `.env.local`. The coach validates the Firebase ID token before calling Gemini, sends calculated evidence for at most 500 trades, and excludes chart URLs and internal trade IDs.

The coach uses `gemini-3.6-flash` through the recommended Gemini Interactions API with `store: false`.

Trades are stored under the authenticated user's Firestore path and are written only after the user submits the trade form.
