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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_signatureresult_free: (a: number, b: number) => void;
  readonly signatureresult_hash: (a: number) => [number, number];
  readonly signatureresult_modulus_limbs: (a: number) => [number, number];
  readonly signatureresult_redc_limbs: (a: number) => [number, number];
  readonly signatureresult_signature_limbs: (a: number) => [number, number];
  readonly __wbg_keypair_free: (a: number, b: number) => void;
  readonly keypair_private_key: (a: number) => [number, number];
  readonly keypair_public_key: (a: number) => [number, number];
  readonly keypair_new: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly create_key_pair: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly generate_signature_from_key: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly generate_signature: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly __wbg_encryptedmessage_free: (a: number, b: number) => void;
  readonly encryptedmessage_data: (a: number) => [number, number];
  readonly encryptedmessage_new: (a: number, b: number) => number;
  readonly encryptedmessage_from_string: (a: number, b: number) => number;
  readonly verify_signature: (a: number, b: number, c: number) => [number, number, number];
  readonly encrypt: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly decrypt: (a: number, b: number, c: number) => [number, number, number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
