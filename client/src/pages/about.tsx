import { Markdown } from "@/_components/markdown";
import { MobileHeader } from "@/_components/mobile-header";
import { PAGE_METADATA } from "@/_constants/seo-config";
import PageContainer from "@/_providers/page-container";

const aboutContent = `
# commbank.eth

### Open Source, Privacy Enhancing Financial Technologies

commbank.eth is a tool to give you and your money more power.

commbank.eth uses next generation cryptography to encrypt and decrypt your (currently ethereum based) assets, using tools and protocols that are open source and free to use forever.

### Private Unstoppable Money 

commbank.eth's first privacy enhancing technology is Private Unstoppable Money.

Private Unstoppable Money is a library of ethereum smart contracts and zero knowledge proof circuits that facilitate the transfer of assets between commbank.eth compatible accounts, completely anonymously on the ethereum network.

### commbank.eth Core Components

In order to power commbank.eth and Private Unstoppable Money specifically, the following components are needed:

- web app (what you're reading this in)
- commbank.eth account model
- smart contracts
- blockchain/ethereum connectivity (RPC)
- smart contract event indexer

### The Web App

This web site/app is deployed and hosted on [IPFS (the interplanetary file system)](https://ipfs.tech/), a distributed file storage system.
All browser code for commbank.eth is downloaded to your browser from IPFS (a service provided by [eth.limo](https://eth.limo/)).

The web app provides and manages all code libraries and data fields required to generate and manage generation of accounts, contacts, Zero Knowledge proofs and transaction history.

There is no backend database that contains any user information, the web app is a designed to run everything on your device and only broadcast transactions when you authorise it.

### The commbank.eth account model

When you sign up for a commbank.eth account, the web app uses passkey authentication to securely store a secret in your browser.
Passkey is a public browser library that stores a secret on your device by website ID, which allows for encrypting and decrypting of secrets. You can read more about them [here](https://www.cyber.gov.au/protect-yourself/secure-your-accounts/passkeys).

When you register this secret on your device, some accounts are generated with the created account secret.

Firstly, your ethereum address which looks like this:

\`0x6e400024D346e8874080438756027001896937E3\`

This is the address where you would send funds through other wallets or exchanges and is not commbank.eth specific.

In order to send someone private money, you need 2 things:

##### their poseidon address, e.g.

\`0x1d320e6bd8d452aa931d1dd3ec97a57d453be0dcfc3d87372d13954cd5a82196\`

##### their envelope address, e.g.

\`0x04ca09e71cb0204958c147fc260b23827a9ecaa4525f0127bd71fe9b5c9c808e4556c5170718c226827a8099464d3f351b586fb1e88ffb9c760bc18cd8a8df01cb\` 

**These private addresses are specifically built for commbank.eth.** When sharing your contact details - commbank.eth recommends the usage
of link sharing or QR code scanning through the 'share' feature in the app (on the home account page).

### Smart Contracts

Private Unstoppable Money uses smart contracts deployed to ethereum to facilitate all of it's privacy enhancing functionalities in the form of ZK SNARKs (Zero Knowledge Succinct, Non-Interactive
Arguments of Knowledge) verifier contracts that verify encrypted transactions are legitimate and allowed. These SNARKs are built with [noir](https://noir-lang.org/), a programmable privacy language.

### Blockchain RPC

An RPC (Remote Procedure Call) is what is used to send transactions and read balances from the blockchain (ethereum). commbank.eth currently uses Infura for its RPC.

### Smart Contract Event Indexer

In order to most efficiency index and catalog commbank.eth private transactions, an indexer is deployed to track all encrypted events that take place.
This indexer tracks state changes on a per transaction level, and makes sent transactions accessible in a more workable manner.

Currently the indexer is built with [envio](https://envio.dev/) and deployed to railway, a centralised hosting service.

### Relayer

In order to facilitate a smoother user experience with regards to submitting transactions, a relayer is used to sponsor users transactions. The relayer is currently deployed to the same server as the indexer, in railway.

### Disclaimer

Your use of this software is your own choice, just like everything else. It might have some bugs or unexpected behaviours, so don't do anything unless it makes sense.

With regards to the legalities of commbank.eth's private unstoppable money - more documentation is on the way, but in the mean time that is a conversation I think is best had at the pub.

If you're curious about how commbank.eth works - you can look at **all** of the [source code in github](https://github.com/hooperben/commbank.eth), all of which is free to use - **forever**.

If you've found a bug? Create an issue in the Github or reach out to the project on [twitter](https://twitter.com/commbankdoteth).

Thanks for reading, take it easy.
`;

export const AboutPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.about}>
      <MobileHeader showSettingsWhenSignedIn />
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 w-full text-left">
        <Markdown>{aboutContent}</Markdown>
      </div>
    </PageContainer>
  );
};
