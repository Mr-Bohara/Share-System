// Secure PBKDF2 + AES-GCM encryption/decryption using Web Crypto API (supported natively in all modern browsers)
export async function encryptText(text: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
  // Import raw password
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  // Derive AES-GCM key
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  // Encrypt content
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBytes = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encoder.encode(text)
  );
  
  // Combine salt + iv + ciphertext into a single Uint8Array
  const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBytes), salt.length + iv.length);
  
  // Convert Uint8Array to Base64 securely
  return btoa(String.fromCharCode(...combined));
}

export async function decryptText(encryptedBase64: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  
  // Convert from Base64
  const combined = new Uint8Array(
    atob(encryptedBase64)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  
  if (combined.length < 28) {
    throw new Error("Invalid encrypted payload size");
  }
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  
  // Import raw password
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  // Derive AES-GCM key
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  // Decrypt content
  const decryptedBytes = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    ciphertext
  );
  
  return decoder.decode(decryptedBytes);
}

// Secure and fast cryptographic hash for comparing secret codes
export async function hashSecretCode(code: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(code + "salt_temp_share_2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
