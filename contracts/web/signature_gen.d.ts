/* tslint:disable */
/* eslint-disable */
export function generate_signature(msg: string, bits: number, exponent: number): SignatureResult;
export class SignatureResult {
  private constructor();
  free(): void;
  readonly hash: string;
  readonly modulus_limbs: string;
  readonly redc_limbs: string;
  readonly signature_limbs: string;
}
