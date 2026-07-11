# US-007 Design: Web Authentication and Account Flow

## Routes

Public routes include sign-up, sign-in, confirm-email status, forgot-password,
and recovery callback/reset-password. Protected routes include the account
screen and future private route group entry.

US-005's Next.js 16 `proxy.ts` refreshes Supabase cookies and performs only the
cheap route gate. Every protected server page, action, and route handler
independently resolves the verified user before reading or writing private data.

## Form Behavior

Server actions or route handlers validate email, password, and display name at
the boundary. Signup, sign-in, resend-confirmation, and forgot-password map
known, unknown, unconfirmed, and rate-limited accounts to user-safe Vietnamese
responses that do not reveal whether an email exists. Provider details are
redacted in server logs. Signup leads to a confirmation-pending screen;
unconfirmed users cannot enter protected routes.

## Return Destination

The requested local path is carried through sign-in only after validation by
the US-005 return-path parser. Direct sign-in defaults to `/`. Confirmation and
recovery callbacks use configured same-origin URLs.

Callbacks accept only the expected flow and a valid authorization code. Missing,
expired, replayed, or wrong-flow codes fail safely. Exchange occurs in the
server adapter; the post-exchange redirect removes codes and tokens from the
URL, and handlers never log the full URL, query, fragment, session, or provider
error.

## Account Screen

The screen shows editable `display_name`, read-only Auth email, confirmation
status, and sign-out. Saving updates only the caller's RLS-protected profile.
