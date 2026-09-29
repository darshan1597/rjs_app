# RJS Customer Web

Customer-facing React website for RJS Tours. It preserves the original marketing design and connects local ride booking to the existing RJS backend.

## Local setup

1. Start `rjs_backend` on port `5000`.
2. Copy `.env.example` to `.env`. Leave `VITE_API_BASE_URL` empty for local development.
3. Run `npm install` and `npm run dev`.
4. Open the Vite URL (normally `http://localhost:5173`).

The Vite development server proxies `/api` to `http://localhost:5000`.

Set `VITE_GOOGLE_MAPS_BROWSER_API_KEY` to a Google Maps JavaScript API key that permits `http://localhost:5173/*`. For deployment, restrict this browser key to the real website domains. This is separate from the Android-restricted keys used by the Flutter apps. `VITE_GOOGLE_MAPS_WEB_MAP_ID` is optional.

## Production build

Set `VITE_API_BASE_URL` to the public HTTPS backend origin, set `VITE_CUSTOMER_APP_URL` to the customer app download URL, then run `npm run build`. Deploy the generated `dist` folder to a static host configured to serve `index.html` for client-side routes.

Add the deployed website origin to the backend `CLIENT_ORIGINS` comma-separated list before launch.

## Current web scope

- Mobile OTP login and customer registration
- Authenticated pickup/destination search
- Live local vehicle catalog and fare estimates
- Immediate and scheduled local ride creation
- Booking confirmation and booking history
- Marketing pages, contact, tour package information and customer policy pages

Live tracking, ride payment, cancellation, wallet and ratings remain app-first features. Outstation/package booking remains informational until those backend booking services are implemented.
