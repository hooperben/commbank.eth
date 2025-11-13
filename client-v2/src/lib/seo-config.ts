export interface SEOConfig {
  title: string;
  description: string;
  url: string;
  siteName: string;
  imageUrl: string;
  imageAlt: string;
  twitterHandle: string;
  githubUrl: string;
  locale: string;
  type: string;
  keywords?: string[];
}

export const DEFAULT_SEO: SEOConfig = {
  title: "commbank.eth",
  description:
    "commbank.eth - Open Source, Privacy Enhancing Financial Technologies",
  url: "https://commbank.eth.limo",
  siteName: "commbank.eth",
  imageUrl: "https://commbank.eth.limo/commbankdotethlogo.jpg",
  imageAlt: "commbank.eth logo",
  twitterHandle: "@commbankdoteth",
  githubUrl: "https://github.com/hooperben/commbank.eth",
  locale: "en_US",
  type: "website",
  keywords: [
    "commbank.eth",
    "decentralized finance",
    "privacy",
    "financial technology",
    "blockchain",
    "ethereum",
    "web3",
    "open source",
    "DeFi",
    "privacy-preserving",
  ],
};

export interface PageMetadata {
  header?: string;
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: string;
}

export const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    title: "commbank.eth | Home",
    description:
      "commbank.eth - Open Source, Privacy Enhancing Financial Technologies.",
    path: "/",
    keywords: [
      "commbank.eth",
      "decentralized banking",
      "privacy finance",
      "blockchain banking",
      "DeFi platform",
    ],
  },
  account: {
    header: "Account",
    title: "commbank.eth | Account",
    description: "Manage your commbank.eth accounts.",
    path: "/account",
    keywords: [
      "account management",
      "user dashboard",
      "crypto wallet",
      "DeFi account",
      "privacy account",
    ],
  },
  about: {
    title: "commbank.eth | About",
    description:
      "Learn about commbank.eth - an open-source project building privacy-enhancing financial technologies.",
    path: "/about",
    keywords: [
      "about commbank.eth",
      "open source finance",
      "privacy technology",
      "blockchain project",
      "Ethereum development",
    ],
  },
  settings: {
    header: "Settings",
    title: "commbank.eth | Settings",
    description:
      "Manage your commbank.eth account - export your credentials and secure your account back ups.",
    path: "/settings",
    keywords: [
      "commbank.eth account",
      "open source finance",
      "privacy technology",
      "blockchain project",
      "passkey",
      "credentials management",
      "Ethereum development",
    ],
  },
};

export function getPageUrl(path: string): string {
  return `${DEFAULT_SEO.url}${path}`;
}

export function getPageTitle(pageTitle?: string): string {
  return pageTitle || DEFAULT_SEO.title;
}

export function mergeWithDefaults(metadata: Partial<PageMetadata>): SEOConfig {
  return {
    ...DEFAULT_SEO,
    title: metadata.title || DEFAULT_SEO.title,
    description: metadata.description || DEFAULT_SEO.description,
    url: getPageUrl(metadata.path || "/"),
    keywords: metadata.keywords || DEFAULT_SEO.keywords,
    type: metadata.type || DEFAULT_SEO.type,
  };
}
