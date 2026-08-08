# Trade Tracker

A modern trading journal built with Next.js and Firebase. Trade Tracker helps traders record executions, review performance, and identify repeatable patterns.

## Features

- Firebase email/password authentication
- Guided trader onboarding and persistent profile preferences
- Adaptive navigation for execution traders versus position traders
- One trading account per user
- Complete trade management with search, filters, sorting, and pagination
- Fictional paper portfolio with leverage and unrealized P/L calculations
- Live CoinGecko pricing for supported crypto paper positions
- P/L, win rate, average RR, and profit-factor metrics
- Monthly performance calendar
- Responsive dark interface

## Local development

```bash
npm install
```

Copy `.env.example` to `.env.local`, add your Firebase Web App configuration, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the regression checks with `npm test` and create a production build with `npm run build`.

## Firebase setup

1. Register a Firebase Web App.
2. Enable Email/Password authentication.
3. Create the default Cloud Firestore database.
4. Publish `firestore.rules` in the Firestore Rules editor.
5. Add the six `NEXT_PUBLIC_FIREBASE_*` values to `.env.local`.

CoinGecko works through its keyless public API by default. For more reliable rate limits, add an optional `COINGECKO_DEMO_API_KEY` to `.env.local`.

Investor and position-trader portfolio reports are delivered through Resend. On Vercel Pro, `vercel.json` invokes the protected report route at 00:00 and 12:00 UTC; Daily and Weekly preferences are filtered inside the route.

Cloud Storage is not required for the current MVP.

## Vercel

Import this repository with the Next.js preset and add the variables from `.env.example`. No custom server, output directory, or port configuration is required.

## Security

Never commit `.env.local`, Firebase Admin service-account credentials, or private keys.
