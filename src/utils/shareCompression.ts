import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import QRCode from 'qrcode';
import { Team, Game } from '../types/soccer';

export type SharePayload =
  | { type: 'team'; version: 1; team: Team }
  | { type: 'backup'; version: 1; data: { teams: Team[]; savedGames?: Game[] } };

function uint8ArrayToBase64Url(u8: Uint8Array): string {
  let bin = '';
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) {
    bin += String.fromCharCode(u8[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    u8[i] = bin.charCodeAt(i);
  }
  return u8;
}

/**
 * Compresses any JSON-serializable object into a URL-safe compact string.
 */
export function compressPayload(payload: SharePayload): string {
  const jsonStr = JSON.stringify(payload);
  const u8 = strToU8(jsonStr);
  const compressed = gzipSync(u8, { level: 9, mtime: 0 });
  return uint8ArrayToBase64Url(compressed);
}

/**
 * Decompresses a URL-safe string back into a SharePayload object.
 */
export function decompressPayload(encoded: string): SharePayload | null {
  try {
    const trimmed = encoded.trim();
    if (!trimmed) return null;
    const u8 = base64UrlToUint8Array(trimmed);
    const decompressed = gunzipSync(u8);
    const jsonStr = strFromU8(decompressed);
    const parsed = JSON.parse(jsonStr) as SharePayload;
    if (parsed && (parsed.type === 'team' || parsed.type === 'backup')) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Failed to decompress share payload:', err);
    return null;
  }
}

/**
 * Generates a full transfer URL with the compressed payload in the hash fragment.
 */
export function generateShareUrl(payload: SharePayload, originOverride?: string): string {
  const code = compressPayload(payload);
  const base = originOverride || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://squadcrafter.vercel.app/');
  const cleanBase = base.split('#')[0].split('?')[0];
  return `${cleanBase}#import=${code}`;
}

/**
 * Extracts and parses a share payload from a URL or raw compressed string.
 */
export function extractPayloadFromInput(input: string): SharePayload | null {
  if (!input) return null;

  // Check for #import= or ?import=
  const hashMatch = input.match(/[#?]import=([A-Za-z0-9_-]+)/);
  if (hashMatch && hashMatch[1]) {
    return decompressPayload(hashMatch[1]);
  }

  // Check if raw compressed string was provided
  return decompressPayload(input);
}

/**
 * Generates a high-contrast QR code Data URL (PNG) from text.
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 360,
    margin: 2,
    color: {
      dark: '#020617', // Dark navy slate
      light: '#ffffff', // Clean white background
    },
    errorCorrectionLevel: 'M',
  });
}
