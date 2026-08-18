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

## Trading-platform connections

Open **Connections** inside the authenticated journal to map a prop firm to its real execution backend. The catalog includes futures and forex/CFD firms plus an **Other / custom prop firm** option, so an account is not blocked by catalog coverage.

Tradovate is the first live connector:

1. Obtain a short-lived Tradovate API access token for the demo or live environment.
2. Choose the prop firm and Tradovate backend.
3. Test the token, select the returned account, then save and synchronize.
4. Deploy the updated Firestore rules: `firebase deploy --only firestore:rules`.

The access token is sent only to the authenticated Next.js route and is never stored in Firestore, browser storage, logs, or connection metadata. A fresh token is required for each manual sync. The importer reconstructs round trips from fills, handles partial exits and reversals, derives local date/day/session, uses product point values for realized P&L when supplied by Tradovate, and uses stable external IDs so repeat syncs update rather than duplicate trades.

Rithmic, ProjectX/TopstepX, MT5, cTrader, TradeLocker, Match-Trader, DXtrade, WealthCharts and generic CSV import are represented in the provider-neutral architecture but still require approved API/vendor access or a dedicated importer before they can synchronize. Never collect or store a trader's prop-firm username and password.
