import { PKCEState } from '../../../../spec/contracts/types';

const PKCE_STORAGE_KEY = 'sc_pkce';

/** Converts a Uint8Array to a base64url string */
function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Generates a cryptographically random PKCE code verifier (43-128 chars) */
export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return toBase64Url(array.buffer);
}

/** Derives the S256 code challenge from a verifier */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(digest);
}

/** Generates a random state string for CSRF protection */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return toBase64Url(array.buffer);
}

/** Stores PKCEState in sessionStorage under key 'sc_pkce' */
export function storePKCEState(state: PKCEState): void {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(state));
}

/** Retrieves and removes PKCEState from sessionStorage */
export function consumePKCEState(): PKCEState | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  try {
    return JSON.parse(raw) as PKCEState;
  } catch {
    return null;
  }
}
