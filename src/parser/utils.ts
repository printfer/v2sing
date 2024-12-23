export function decodeBase64(base64: string): string {
  // Regular expression to match valid Base64 strings
  const base64Regex = /[A-Za-z0-9+/=]+/;

  // Ensure valid padding for Base64 string
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  // Extract the Base64 part
  const match = base64.match(base64Regex);

  if (!match) {
    throw new Error("No valid Base64 string found in: ${base64}");
  }

  // Decode Base64 to binary string
  const binaryString = atob(match[0].trim());

  // Convert binary string to a proper UTF-8 string
  const utf8Decoder = new TextDecoder("utf-8");
  const binaryArray = Uint8Array.from(
    binaryString,
    (char) => char.charCodeAt(0),
  );
  return utf8Decoder.decode(binaryArray);
}

export function isBase64(str: string): boolean {
  // Check if the string matches the Base64 pattern
  const base64Regex =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!base64Regex.test(str)) {
    return false;
  }

  try {
    // Attempt to decode the string to validate it's valid Base64
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

export function getRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ("0" + byte.toString(16)).slice(-2)).join(
    "",
  ).substring(0, length);
}
