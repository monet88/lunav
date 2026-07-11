// Next.js 16.2.x does not re-export isRedirectError from `next/navigation`.
// Keep the private import in one place so tests do not scatter dist paths.
export { isRedirectError } from 'next/dist/client/components/redirect-error'
