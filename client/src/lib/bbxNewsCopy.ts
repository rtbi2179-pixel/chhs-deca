/**
 * Legacy BBX articles may have been written before magnitude disclosure was
 * removed from Blue's News. Preserve the learning context while withholding the
 * numeric change members should infer from the news and market board.
 */
export function hideBbxMagnitude(value: string): string {
  return value.replace(/,?\s*with a sampled magnitude of\s*[+-]?\d+(?:\.\d+)?%\.?/gi, ".").replace(/\.\./g, ".").trim();
}
