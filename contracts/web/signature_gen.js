
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(`util`);

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}
/**
 * @param {string} secret
 * @param {number} bits
 * @param {number} exponent
 * @returns {KeyPair}
 */
module.exports.create_key_pair = function(secret, bits, exponent) {
    const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.create_key_pair(ptr0, len0, bits, exponent);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return KeyPair.__wrap(ret[0]);
};

/**
 * @param {string} msg
 * @param {Uint8Array} private_key
 * @returns {SignatureResult}
 */
module.exports.generate_signature_from_key = function(msg, private_key) {
    const ptr0 = passStringToWasm0(msg, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.generate_signature_from_key(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return SignatureResult.__wrap(ret[0]);
};

/**
 * @param {string} msg
 * @param {number} bits
 * @param {number} exponent
 * @returns {SignatureResult}
 */
module.exports.generate_signature = function(msg, bits, exponent) {
    const ptr0 = passStringToWasm0(msg, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.generate_signature(ptr0, len0, bits, exponent);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return SignatureResult.__wrap(ret[0]);
};

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 * @param {SignatureResult} signature_result
 * @param {Uint8Array} public_key
 * @returns {boolean}
 */
module.exports.verify_signature = function(signature_result, public_key) {
    _assertClass(signature_result, SignatureResult);
    const ptr0 = passArray8ToWasm0(public_key, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.verify_signature(signature_result.__wbg_ptr, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
};

/**
 * @param {string} message
 * @param {Uint8Array} public_key
 * @returns {EncryptedMessage}
 */
module.exports.encrypt = function(message, public_key) {
    const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(public_key, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.encrypt(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return EncryptedMessage.__wrap(ret[0]);
};

/**
 * @param {EncryptedMessage} encrypted
 * @param {Uint8Array} private_key
 * @returns {string}
 */
module.exports.decrypt = function(encrypted, private_key) {
    let deferred3_0;
    let deferred3_1;
    try {
        _assertClass(encrypted, EncryptedMessage);
        const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.decrypt(encrypted.__wbg_ptr, ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
};

const EncryptedMessageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptedmessage_free(ptr >>> 0, 1));

class EncryptedMessage {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EncryptedMessage.prototype);
        obj.__wbg_ptr = ptr;
        EncryptedMessageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptedMessageFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptedmessage_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get data() {
        const ret = wasm.encryptedmessage_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}
module.exports.EncryptedMessage = EncryptedMessage;

const KeyPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_keypair_free(ptr >>> 0, 1));

class KeyPair {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(KeyPair.prototype);
        obj.__wbg_ptr = ptr;
        KeyPairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyPairFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_keypair_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get private_key() {
        const ret = wasm.keypair_private_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get public_key() {
        const ret = wasm.keypair_public_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} private_key
     * @param {Uint8Array} public_key
     */
    constructor(private_key, public_key) {
        const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(public_key, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.keypair_new(ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        KeyPairFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
module.exports.KeyPair = KeyPair;

const SignatureResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_signatureresult_free(ptr >>> 0, 1));

class SignatureResult {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SignatureResult.prototype);
        obj.__wbg_ptr = ptr;
        SignatureResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SignatureResultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_signatureresult_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get hash() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.signatureresult_hash(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get modulus_limbs() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.signatureresult_modulus_limbs(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get redc_limbs() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.signatureresult_redc_limbs(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get signature_limbs() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.signatureresult_signature_limbs(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
module.exports.SignatureResult = SignatureResult;

module.exports.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
    const ret = arg0.buffer;
    return ret;
};

module.exports.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

module.exports.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments) };

module.exports.__wbg_crypto_ed58b8e10a292839 = function(arg0) {
    const ret = arg0.crypto;
    return ret;
};

module.exports.__wbg_getRandomValues_bcb4912f16000dc4 = function() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments) };

module.exports.__wbg_msCrypto_0a36e2ec3a343d26 = function(arg0) {
    const ret = arg0.msCrypto;
    return ret;
};

module.exports.__wbg_new_a12002a7f91c75be = function(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
};

module.exports.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return ret;
};

module.exports.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
};

module.exports.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
};

module.exports.__wbg_node_02999533c4ea02e3 = function(arg0) {
    const ret = arg0.node;
    return ret;
};

module.exports.__wbg_process_5c1d670bc53614b8 = function(arg0) {
    const ret = arg0.process;
    return ret;
};

module.exports.__wbg_randomFillSync_ab2cfe79ebbf2740 = function() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments) };

module.exports.__wbg_require_79b1e9274cde3c87 = function() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments) };

module.exports.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
};

module.exports.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

module.exports.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

module.exports.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

module.exports.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

module.exports.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
};

module.exports.__wbg_versions_c71aa1626a93e0a1 = function(arg0) {
    const ret = arg0.versions;
    return ret;
};

module.exports.__wbindgen_error_new = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

module.exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_export_2;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

module.exports.__wbindgen_is_function = function(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
};

module.exports.__wbindgen_is_object = function(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

module.exports.__wbindgen_is_string = function(arg0) {
    const ret = typeof(arg0) === 'string';
    return ret;
};

module.exports.__wbindgen_is_undefined = function(arg0) {
    const ret = arg0 === undefined;
    return ret;
};

module.exports.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return ret;
};

module.exports.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

const path = require('path').join(__dirname, 'signature_gen_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

wasm.__wbindgen_start();

