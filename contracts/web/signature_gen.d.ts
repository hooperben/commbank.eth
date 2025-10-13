/* tslint:disable */
/* eslint-disable */
export function create_key_pair(secret: string, bits: number, exponent: number): KeyPair;
export function generate_signature_from_key(msg: string, private_key: Uint8Array): SignatureResult;
export function generate_signature(msg: string, bits: number, exponent: number): SignatureResult;
export function verify_signature(signature_result: SignatureResult, public_key: Uint8Array): boolean;
export function encrypt(message: string, public_key: Uint8Array): EncryptedMessage;
export function decrypt(encrypted: EncryptedMessage, private_key: Uint8Array): string;
export class EncryptedMessage {
  free(): void;
  constructor(data: Uint8Array);
  static from_string(text: string): EncryptedMessage;
  readonly data: Uint8Array;
}
export class KeyPair {
  free(): void;
  constructor(private_key: Uint8Array, public_key: Uint8Array);
  readonly private_key: Uint8Array;
  readonly public_key: Uint8Array;
}
export class SignatureResult {
  private constructor();
  free(): void;
  readonly hash: string;
  readonly modulus_limbs: string;
  readonly redc_limbs: string;
  readonly signature_limbs: string;
}
