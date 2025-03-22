### Rust RSA to WASM

run this to export

```
# build it
cargo build --target wasm32-unknown-unknown --features wasm --no-default-features

# generate bindings for Node.js
wasm-bindgen --target nodejs target/wasm32-unknown-unknown/debug/signature_gen.wasm --out-dir ../contracts/web

# OR for web browsers (original)
# wasm-bindgen --target web target/wasm32-unknown-unknown/debug/signature_gen.wasm --out-dir ../contracts/web
```
