export const getIndexerUrl = () => {
  const URL = import.meta.env.VITE_INDEXER_URL;
  if (!URL) throw new Error("Config missing");
  return URL;
};
