/* tslint:disable */
/* eslint-disable */
export function create_key_pair(secret: string, bits: number, exponent: number): KeyPair;
export function generate_signature_from_key(msg: string, private_key: Uint8Array): SignatureResult;
export function generate_signature(msg: string, bits: number, exponent: number): SignatureResult;
export class KeyPair {
  private constructor();
  free(): void;
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
