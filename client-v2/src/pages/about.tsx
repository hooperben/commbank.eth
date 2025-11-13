import PageContainer from "@/components/page-container";
import { Markdown } from "@/components/markdown";
import { PAGE_METADATA } from "@/lib/seo-config";

const aboutContent = `
# commbank.eth

### Open Source, Privacy Enhancing Financial Technologies

commbank.eth is a tool to give you and your money more power.

commbank.eth uses next generation cryptography to encrypt and decrypt your (currently ethereum based) assets, using tools and protocols that are open source and free to use forever.

### Your commbank.eth account

When a user signs up for a commbank.eth account, commbank.eth uses passkey to create a **commbank.eth** passkey record in your preferred passkey provider. Once you have registered this passkey, a random secret is generated, which seeds all of your other accounts. This random secret is then encrypted with your passkey public key, and stored in your browser.

### Private Unstoppable Money 

commbank.eth's first privacy enhancing technology is Private Unstoppable Money.

Private Unstoppable Money is a library of ethereum smart contracts and zero knowledge proof circuits that facilitate the transfer of assets between commbank.eth compatible accounts completely anonymously.

In order to send someone private money, you need 2 things:

##### their poseidon address, e.g.

\`0x1d320e6bd8d452aa931d1dd3ec97a57d453be0dcfc3d87372d13954cd5a82196\`

##### their signing key, e.g.

\`0x04ca09e71cb0204958c147fc260b23827a9ecaa4525f0127bd71fe9b5c9c808e4556c5170718c226827a8099464d3f351b586fb1e88ffb9c760bc18cd8a8df01cb\` 

your private addresses can be copied or scanned together from the account page.

### This Website

Is hosted on IPFS (the interplanetary file system), a distributed file storage system. All browser code for commbank.eth is downloaded to your browser from IPFS (a service provided by [eth.limo](https://eth.limo/)), there's no backend tracking or analytics of users.

a fair point of critique is that **commbank.eth uses pampalo's servers to run the commbank.eth indexer, and uses [Alchemy](https://www.alchemy.com) as an RPC provider to connect to chains (routed through pampalo)**. This is all open source and trackable, but ideally the user should be able to choose which backends they use.

There's a lot more information about how commbank.eth works and it's known limitations in the documentation (TODO insert link), or you can [view the github here](https://github.com/hooperben/commbank.eth).

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
