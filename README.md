# Journal Trade

Next.js + TypeScript + Firebase application for recording trades, reviewing performance, and maintaining a private trading journal.

## Local setup

1. Copy `.env.local.example` to `.env.local` and paste the Firebase Web App configuration values from Firebase Console.
2. In Firebase Authentication, enable Email/Password.
3. Create Cloud Firestore and Firebase Storage.
4. Deploy the included Firestore and Storage rules with `firebase deploy --only firestore,storage`.
5. Configure Firebase App Check before enforcing it for production services.
6. Run `npm install`, then `npm run dev`.

Trades are stored under the authenticated user's Firestore path and are written only after the user submits the trade form.
