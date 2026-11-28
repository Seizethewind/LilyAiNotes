const MESSAGES: Record<string, string> = {
  google_unconfigured: "Google sign-in is not set up on this server yet.",
  google_account_exists:
    "An account with this email already exists. Sign in with your password, then connect Google in Settings.",
  google_state_mismatch: "That Google sign-in expired. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_email_unverified: "Your Google email must be verified.",
  google_in_use: "That Google account is already connected to another user.",
  google_already_linked: "A different Google account is already connected.",
  unauthorized: "Your session expired. Sign in and try again.",
};

export function describeGoogleError(code: string | null): string | null {
  if (!code) return null;
  // hasOwn: the code comes from the URL, so "constructor" must not match a built-in property.
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : "Google sign-in failed. Please try again.";
}
