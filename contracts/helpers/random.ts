import * as crypto from "crypto";

export const generateRandomSecret = (): Uint8Array => {
  const buffer = crypto.randomBytes(32);
  return new Uint8Array(buffer);
};
