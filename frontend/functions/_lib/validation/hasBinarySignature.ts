export function hasBinarySignature(raw: Uint8Array): "pdf" | "binary" | null {
  if (raw.includes(0)) return "binary";
  if (raw.length >= 5 && new TextDecoder().decode(raw.slice(0, 5)) === "%PDF-") {
    return "pdf";
  }
  const isExe = raw.length >= 2 && raw[0] === 0x4d && raw[1] === 0x5a;
  const isElf = raw.length >= 4 && raw[0] === 0x7f && raw[1] === 0x45 && raw[2] === 0x4c && raw[3] === 0x46;
  const isZip = raw.length >= 4 && raw[0] === 0x50 && raw[1] === 0x4b && raw[2] === 0x03 && raw[3] === 0x04;
  const isPng = raw.length >= 4 && raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4e && raw[3] === 0x47;
  const isJpeg = raw.length >= 3 && raw[0] === 0xff && raw[1] === 0xd8 && raw[2] === 0xff;
  const isGif = raw.length >= 4 && new TextDecoder().decode(raw.slice(0, 4)) === "GIF8";
  const isGzip = raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b;
  if (isExe || isElf || isZip || isPng || isJpeg || isGif || isGzip) {
    return "binary";
  }
  return null;
}
