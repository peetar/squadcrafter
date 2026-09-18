import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import QRCode from 'qrcode';
import { Team, Player, Game } from '../types/soccer';

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

function base64UrlToUint8Array(str: string): Uint8Array | null {
  try {
    // 1. Decode potential percent-encoding (e.g. %2B, %2F, %3D)
    let clean = decodeURIComponent(str.trim());
    // 2. Remove any extraneous whitespace, newlines, or quotation marks
    clean = clean.replace(/[\s"']/g, '');
    // 3. Convert standard URL-safe base64 characters (- and _) to (+ and /)
    let b64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    // 4. Pad with = up to a multiple of 4
    while (b64.length % 4) {
      b64 += '=';
    }
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      u8[i] = bin.charCodeAt(i);
    }
    return u8;
  } catch (err) {
    console.warn('Base64 decode failed:', err);
    return null;
  }
}

// Compact representation for Team to minimize QR density:
// [2, name, defaultPlayerCount, primaryColor, secondaryColor, playersArray]
// where each player is [name, number, skillLevel, preferredPositionsCommaSeparated, canPlayGK(1/0), notes]
type CompactTeamArray = [
  2,
  string,
  number,
  string,
  string,
  [string, number, number, string, number, string][]
];

/**
 * Compresses a SharePayload into a minimal URL-safe string.
 * For teams, uses a dense schema representation to reduce QR size by ~50%.
 */
export function compressPayload(payload: SharePayload): string {
  let objectToCompress: any = payload;

  if (payload.type === 'team') {
    const t = payload.team;
    const compactTeam: CompactTeamArray = [
      2,
      t.name,
      t.defaultPlayerCount,
      t.primaryColor || '#2563eb',
      t.secondaryColor || '#facc15',
      t.players.map(p => [
        p.name,
        p.number,
        p.skillLevel,
        (p.preferredPositions || []).join(','),
        p.canPlayGK ? 1 : 0,
        p.notes || ''
      ])
    ];
    objectToCompress = compactTeam;
  }

  const jsonStr = JSON.stringify(objectToCompress);
  const u8 = strToU8(jsonStr);
  const compressed = gzipSync(u8, { level: 9, mtime: 0 });
  return uint8ArrayToBase64Url(compressed);
}

/**
 * Decompresses a URL-safe string back into a SharePayload object.
 * Transparently supports both legacy verbose payloads and compact v2 schema.
 */
export function decompressPayload(encoded: string): SharePayload | null {
  try {
    const trimmed = encoded.trim();
    if (!trimmed) return null;
    const u8 = base64UrlToUint8Array(trimmed);
    if (!u8) return null;
    const decompressed = gunzipSync(u8);
    const jsonStr = strFromU8(decompressed);
    const parsed = JSON.parse(jsonStr);

    // 1. Check for compact team array format: [2, name, count, primary, secondary, players]
    if (Array.isArray(parsed) && parsed[0] === 2) {
      const [_, name, count, primary, secondary, rawPlayers] = parsed as CompactTeamArray;
      const teamId = 'team-' + Date.now();
      const players: Player[] = (rawPlayers || []).map((rp, idx) => {
        const [pName, num, skill, prefPosStr, canGk, notes] = rp;
        return {
          id: `p-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          teamId,
          name: pName,
          number: num,
          skillLevel: skill,
          preferredPositions: prefPosStr ? (prefPosStr.split(',') as any) : ['MID'],
          canPlayGK: Boolean(canGk),
          notes: notes || undefined,
        };
      });

      const team: Team = {
        id: teamId,
        name,
        defaultPlayerCount: count,
        primaryColor: primary,
        secondaryColor: secondary,
        players,
        createdAt: Date.now(),
      };

      return { type: 'team', version: 1, team };
    }

    // 2. Check for standard verbose SharePayload
    if (parsed && (parsed.type === 'team' || parsed.type === 'backup')) {
      return parsed as SharePayload;
    }

    return null;
  } catch (err) {
    console.error('Failed to decompress share payload:', err);
    return null;
  }
}

/**
 * Generates a full transfer URL with the compressed payload in the hash fragment.
 * Uses short key `#i=` to save precious characters for older camera QR scanners.
 */
export function generateShareUrl(payload: SharePayload, originOverride?: string): string {
  const code = compressPayload(payload);
  const base = originOverride || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://squadcrafter.vercel.app/');
  const cleanBase = base.split('#')[0].split('?')[0];
  return `${cleanBase}#i=${code}`;
}

/**
 * Extracts and parses a share payload from a URL or raw compressed string.
 * Supports #i=, #import=, ?i=, ?import=.
 */
export function extractPayloadFromInput(input: string): SharePayload | null {
  if (!input) return null;

  // Check for #i=, #import=, ?i=, or ?import=
  const hashMatch = input.match(/[#?](?:i|import)=([A-Za-z0-9_-]+)/);
  if (hashMatch && hashMatch[1]) {
    return decompressPayload(hashMatch[1]);
  }

  // Check if raw compressed string was provided
  return decompressPayload(input);
}

/**
 * Generates an ultra-readable QR code Data URL (PNG).
 * - Error correction Level 'L' minimizes grid complexity by ~30%, making finder patterns large.
 * - Margin of 4 ensures phone camera edge detection locks on immediately.
 * - Crisp pure black on pure white for maximum optical contrast on all phone cameras.
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 480,
    margin: 4,
    color: {
      dark: '#000000', // Pure black for maximal contrast
      light: '#ffffff', // Pure white background
    },
    errorCorrectionLevel: 'L',
  });
}
