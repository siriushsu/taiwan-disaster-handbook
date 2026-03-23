// Auto-read from VERSION file at build time via next.config
// Falls back to package.json version
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
