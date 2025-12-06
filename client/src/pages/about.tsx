import PageContainer from "@/components/page-container";
import { Markdown } from "@/components/markdown";
import { PAGE_METADATA } from "@/lib/seo-config";

const aboutContent = `
# commbank.eth

### Open Source, Privacy Enhancing Financial Technologies

commbank.eth is a tool to give you and your money more power.

commbank.eth uses next generation cryptography to encrypt and decrypt your (currently ethereum based) assets, using tools and protocols that are open source and free to use forever.

### Private Unstoppable Money 

commbank.eth's first privacy enhancing technology is Private Unstoppable Money.

Private Unstoppable Money is a library of ethereum smart contracts and zero knowledge proof circuits that facilitate the transfer of assets between commbank.eth compatible accounts completely anonymously.

### commbank.eth Core Components

In order to power Private Unstoppable Money, the following components are needed:

- web app (what you're reading this in)
- commbank.eth account model
- smart contracts
- smart contract indexer
- blockchain connectivity (RPC)

### Web App

Is hosted on IPFS (the interplanetary file system), a distributed file storage system. All browser code for commbank.eth is downloaded to your browser from IPFS (a service provided by [eth.limo](https://eth.limo/)), there's no backend tracking or analytics of users.

This web app also provides and manages all proving libraries and data fields required to generate and manage generation of ZK proofs more efficiently.

### Your commbank.eth account

When a user signs up for a commbank.eth account, commbank.eth uses passkey to create a **commbank.eth** passkey record in your preferred passkey provider. Once you have registered this passkey, a random secret is generated, which seeds all of your other accounts. This random secret is then encrypted with your passkey public key, and stored in your browser.

In order to send someone private money, you need 2 things:

##### their poseidon address, e.g.

\`0x1d320e6bd8d452aa931d1dd3ec97a57d453be0dcfc3d87372d13954cd5a82196\`

##### their signing key, e.g.

\`0x04ca09e71cb0204958c147fc260b23827a9ecaa4525f0127bd71fe9b5c9c808e4556c5170718c226827a8099464d3f351b586fb1e88ffb9c760bc18cd8a8df01cb\` 

your private addresses can be copied or scanned together from the account page.

### Smart Contracts

Private Unstoppable Money uses smart contracts deployed to ethereum to facilitate all of it's privacy enhancing functionalities in the form of ZK / SNARK (Succinct, Non-Interactive
Arguments of Knowledge) verifier contracts that verify encrypted transactions are legitimate and allowed.

### Indexer

In order to most efficiency index commbank.eth transfers, an envio indexer is deployed. This indexer tracks all state changes, and makes sent notes accessible in a much more workable manner.

Currently the backend indexer is built with envio and it's deployment is available to view in Github, but it is a centralised deployment on Railway.
The ability to add/modify indexers based on user preference is in the backlog.

### RPC

An RPC is what is used to send transactions and read balances from the blockchain (ethereum). commbank.eth currently uses Alchemy for it's RPC, but custom RPC setting is also in the backlog.


### Disclaimer

Your use of this software is your own choice, just like everything else. It might have some bugs, so don't do anything unless it looks good and makes sense. Found a bug? Create an issue in the Github or @ the project on twitter (@commbankdoteth).
`;

export const AboutPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.about}>
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 w-full text-left">
        <Markdown>{aboutContent}</Markdown>
      </div>
    </PageContainer>
  );
};
