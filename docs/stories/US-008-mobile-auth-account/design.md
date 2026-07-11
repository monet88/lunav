# US-008 Design: Mobile Authentication and Account Flow

## Navigation

Expo Router `Stack.Protected` guards the private route group with confirmed
authenticated state and exposes the auth route group otherwise. Loading state
does not briefly render private content.

## Deep Links

`app.json` declares `lunav://` for local development only. Hosted Android
confirmation and recovery use verified HTTPS Android App Links with
`assetlinks.json` and the package signing fingerprint. URLs route only to
explicit auth callback paths; an unverified handler must not receive the hosted
callback.

Callbacks accept only the expected flow and a valid authorization code. Missing,
expired, replayed, or wrong-flow codes fail safely. After exchange, navigation
replaces the callback URL so codes or tokens do not remain in history. The app
never logs the full deep link, query, fragment, session, or provider error.

## Session Lifecycle

The US-005 mobile adapter persists the session in secure native storage and
controls refresh around React Native AppState changes. Screens never read or
write token storage directly.

## Account Screen

The screen shows editable `display_name`, read-only email, confirmation status,
and sign-out. Saving updates only the authenticated profile through RLS.
