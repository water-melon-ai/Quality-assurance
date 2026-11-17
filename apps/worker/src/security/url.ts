/**
 * SSRF protection: only public http(s) hosts may be scanned.
 * Blocks localhost, private/link-local/CGNAT ranges and hostnames that resolve to them.
 */
import dns from 'node:dns/promises';
import net from 'node:net';

export class UrlNotAllowedError extends Error {}

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a = 0, b = 0] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::' || l === '::1') return true;
    if (/^f[cd]/.test(l) || /^fe[89ab]/.test(l)) return true;
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return isPrivateIp(mapped[1]);
    return false;
  }
  return true;
}

/** Cheap synchronous check (used for in-browser request filtering). */
export function isBlockedHostnameSync(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  return net.isIP(h) ? isPrivateIp(h) : false;
}

/** Validates the URL and resolves DNS; throws UrlNotAllowedError when the target is not public. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlNotAllowedError('Invalid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlNotAllowedError('Only http(s) URLs can be scanned.');
  }
  if (url.username || url.password) throw new UrlNotAllowedError('URLs with credentials are not allowed.');
  if (isBlockedHostnameSync(url.hostname)) throw new UrlNotAllowedError('This address cannot be scanned.');

  if (!net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) {
    let addrs: { address: string }[];
    try {
      addrs = await dns.lookup(url.hostname, { all: true });
    } catch {
      throw new UrlNotAllowedError(`Could not resolve ${url.hostname}.`);
    }
    if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
      throw new UrlNotAllowedError('This address cannot be scanned.');
    }
  }
  return url;
}
