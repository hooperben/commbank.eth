const generateMD5 = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(32, "0");
  return hexHash;
};

export const gravatarUrl = (address: string) =>
  `https://www.gravatar.com/avatar/${generateMD5(address)}?d=identicon&s=200`;
