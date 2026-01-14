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
  ogImage?: string;
  ogImageAlt?: string;
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
  ogImage?: string;
  ogImageAlt?: string;
}

const OG_IMAGE = "https://dev.commbank.eth.limo/opengraph-test.png";
const OG_IMAGE_ALT = "commbank.eth - Privacy-Enhancing Financial Technologies";

export const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    title: "commbank.eth | Home",
    description:
      "commbank.eth - Open Source, Privacy Enhancing Financial Technologies.",
    path: "/",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
    keywords: [
      "commbank.eth",
      "decentralized banking",
      "privacy finance",
      "blockchain banking",
      "DeFi platform",
    ],
  },
  share: {
    header: "Add a new contact",
    title: "commbank.eth | Add new contact",
    description: "Add a new commbank.eth contact",
    path: "/account",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
    keywords: [
      "account management",
      "contacts",
      "private address",
      "user dashboard",
      "crypto wallet",
      "DeFi account",
      "privacy account",
    ],
  },
  contacts: {
    header: "Contacts",
    title: "commbank.eth | My Contacts",
    description: "View your commbank.eth contacts",
    path: "/account",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
    keywords: [
      "account management",
      "contacts",
      "private address",
      "user dashboard",
      "crypto wallet",
      "DeFi account",
      "privacy account",
    ],
  },
  account: {
    header: "Account",
    title: "commbank.eth | Account",
    description: "Manage your commbank.eth accounts.",
    path: "/account",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
    keywords: [
      "account management",
      "user dashboard",
      "crypto wallet",
      "DeFi account",
      "privacy account",
    ],
  },
  accounts: {
    header: "Accounts",
    title: "commbank.eth | Accounts",
    description: "Manage your commbank.eth accounts.",
    path: "/accounts",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
    keywords: [
      "account management",
      "user dashboard",
      "crypto wallet",
      "DeFi account",
      "privacy account",
    ],
  },
  transactions: {
    title: "commbank.eth | Transactions",
    description: "View your commbank.eth transaction history.",
    path: "/transactions",
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
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
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
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
    ogImage: OG_IMAGE,
    ogImageAlt: OG_IMAGE_ALT,
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
    ogImage: metadata.ogImage || DEFAULT_SEO.ogImage,
    ogImageAlt: metadata.ogImageAlt || DEFAULT_SEO.ogImageAlt,
  };
}
