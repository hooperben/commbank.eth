async function main() {
  console.log("hey");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
