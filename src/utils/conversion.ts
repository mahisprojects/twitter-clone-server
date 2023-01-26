export const b64EncodeUnicode = (str) => btoa(encodeURIComponent(str));

export const UnicodeDecodeB64 = (str) => decodeURIComponent(atob(str));
// Buffer.from(str, "base64")