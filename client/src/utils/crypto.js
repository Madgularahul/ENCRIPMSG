import CryptoJS from 'crypto-js';

/**
 * Vigenere Cipher implementation for simple key-based text transformation
 */
function vigenereEncrypt(text, key) {
  if (!key) return text;
  let result = '';
  let keyIndex = 0;
  const cleanKey = key.toUpperCase();

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;

    // Encrypt uppercase
    if (charCode >= 65 && charCode <= 90) {
      result += String.fromCharCode(((charCode - 65 + shift) % 26) + 65);
      keyIndex++;
    } 
    // Encrypt lowercase
    else if (charCode >= 97 && charCode <= 122) {
      result += String.fromCharCode(((charCode - 97 + shift) % 26) + 97);
      keyIndex++;
    } 
    // Keep numbers and symbols intact
    else {
      result += text[i];
    }
  }
  return result;
}

function vigenereDecrypt(ciphertext, key) {
  if (!key) return ciphertext;
  let result = '';
  let keyIndex = 0;
  const cleanKey = key.toUpperCase();

  for (let i = 0; i < ciphertext.length; i++) {
    const charCode = ciphertext.charCodeAt(i);
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;

    if (charCode >= 65 && charCode <= 90) {
      result += String.fromCharCode(((charCode - 65 - shift + 26) % 26) + 65);
      keyIndex++;
    } else if (charCode >= 97 && charCode <= 122) {
      result += String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
      keyIndex++;
    } else {
      result += ciphertext[i];
    }
  }
  return result;
}

/**
 * Encrypt plain text using selected algorithm and secret key
 */
export function encryptText(text, secretKey, algorithm) {
  if (!text || !secretKey) {
    throw new Error('Both message text and secret key are required for encryption');
  }

  try {
    switch (algorithm) {
      case 'AES-256':
        return CryptoJS.AES.encrypt(text, secretKey).toString();

      case 'Triple-DES':
        return CryptoJS.TripleDES.encrypt(text, secretKey).toString();

      case 'Vigenere-Cipher':
        return vigenereEncrypt(text, secretKey);

      default:
        throw new Error('Unsupported encryption algorithm');
    }
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt message with the provided key.');
  }
}

/**
 * Decrypt ciphertext using selected algorithm and secret key
 */
export function decryptText(ciphertext, secretKey, algorithm) {
  if (!ciphertext || !secretKey) {
    throw new Error('Ciphertext and secret key are required for decryption');
  }

  try {
    switch (algorithm) {
      case 'AES-256': {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
          throw new Error('Invalid secret key or corrupted data');
        }
        return originalText;
      }

      case 'Triple-DES': {
        const bytes = CryptoJS.TripleDES.decrypt(ciphertext, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
          throw new Error('Invalid secret key or corrupted data');
        }
        return originalText;
      }

      case 'Vigenere-Cipher': {
        const decrypted = vigenereDecrypt(ciphertext, secretKey);
        return decrypted;
      }

      default:
        throw new Error('Unsupported encryption algorithm');
    }
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Decryption failed! Please double check your secret key.');
  }
}
