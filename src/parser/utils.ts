export function decodeBase64(base64: string): string {
  const normalizedBase64 = normalizeBase64(base64);
  const binaryString = atob(padBase64(normalizedBase64));
  const utf8Decoder = new TextDecoder("utf-8");
  const binaryArray = Uint8Array.from(
    binaryString,
    (char) => char.charCodeAt(0),
  );
  return utf8Decoder.decode(binaryArray);
}

export function isBase64(str: string): boolean {
  const normalizedBase64 = normalizeBase64(str);
  if (
    normalizedBase64 === "" ||
    normalizedBase64.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(padBase64(normalizedBase64))
  ) {
    return false;
  }

  try {
    const paddedBase64 = padBase64(normalizedBase64);
    return btoa(atob(paddedBase64)).replace(/=+$/, "") ===
      paddedBase64.replace(/=+$/, "");
  } catch {
    return false;
  }
}

function normalizeBase64(base64: string): string {
  return base64.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(
    /_/g,
    "/",
  );
}

function padBase64(base64: string): string {
  let paddedBase64 = base64;
  while (paddedBase64.length % 4 !== 0) {
    paddedBase64 += "=";
  }
  return paddedBase64;
}

export function getRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ("0" + byte.toString(16)).slice(-2)).join(
    "",
  ).substring(0, length);
}
