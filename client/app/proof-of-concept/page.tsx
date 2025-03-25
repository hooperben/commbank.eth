"use client";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 p-6 gap-4">
      <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
        commbank.eth explained
      </h2>

      <h6 className="text-lg text-amber-500">Foreword/Legal Disclaimer</h6>

      <p>
        The following is a detailed explanation of how I was able to use
        commbank.eth&apos;s technology to privately send my sister some money
        for a coffee, but first a disclaimer.
      </p>

      <p>
        commbank.eth private transfers are currently only enabled for me
        (meaning only I can deposit real money to the encrypted protocol). As
        you can probably imagine, the ability to make money vanish in one spot
        and appear in another is very attractive to those on the other side of
        the law. It is not impossible to regulate and enforce the same
        compliance regulations we have in the traditional finance system in
        commbank.eth, but it is much harder.
      </p>

      <p>
        Due to this being the current state of things and me valuing not being
        sent to prison for facilitating crime and/or North Korean money
        laundering - before private transfers can be open to anyone else, I need
        to consult with a bunch of very expensive legal people and traditional
        finance people, and then develop what they advise. If you are one of
        these people (and/or would be interested in funding this kind of thing),
        you should reach out to me.
      </p>

      <p>
        Now that I&apos;ve done my &apos;here&apos;s why I can&apos;t be
        imprisoned for this&apos; explanation, let us get into the magic of how
        commbank.eth works.
      </p>

      <h6 className="text-lg text-amber-500">Context</h6>

      <p>
        Any time that you have heard of any cryptocurrency, there is a 99.99%
        chance that the token being discussed is a public token, often an ERC-20
        (or an SPL token on Solana, ASA on Algorand, et cetera). Public here
        meaning that everybody can see how much every address holds. For
        example, here&apos;s the list of the top 10 holders of the TRUMP
        memecoin:
      </p>

      <div className="flex flex-col gap-1 text-sm">
        <img
          src="/trump-holders.png"
          alt="trump-holders"
          className="max-w-[800px]"
        />
        <p>
          Source:{" "}
          <a
            href="https://solscan.io/token/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN#holders"
            target="_blank"
            className="text-primary"
            rel="noopener noreferrer"
          >
            SolScan
          </a>
        </p>
      </div>

      <p>
        This is a noted feature of blockchains, the fact that everyone can see
        everything means that accountability and transparency are much more
        tangible, but it&apos;s a terrible feature compared to the privacy that
        our traditional banking system offers. If we could all see each others
        bank balances, the dynamic of society would change pretty drastically,
        and probably not for the better.
      </p>

      <p>
        The adoption of blockchain usage to track assets resembles something
        much larger than the ability to publicly track assets, it represents a
        movement of our current financial system away from requiring middlemen
        to facilitate digital payments.
      </p>

      <p>
        As the internet and digital payments specifically have increased
        exponentially, a handful of very powerful corporations have essentially
        formed a monopoly on how money moves. These corporations and the fees
        that they charge are currently quite a political issue in Australia, as
        it is basically theft. ~1% surcharges on all transactions is not a good
        outcome for anybody except these corporations, and contributes even more
        to the ongoing cost of living pressures.
      </p>

      <p>
        But, not all hope is lost. What if we could have the privacy that we
        have with the traditional banking system, but on public computers? Where
        we don&apos;t pay a middleman to facilitate the transaction, we pay for
        the electricity to process the transaction. This thought experiment is
        the thesis for <span className="text-primary">commbank.eth</span>.
      </p>

      <h6 className="text-lg text-amber-500">
        How do we get privacy, publicly?
      </h6>

      <p>
        Zero Knowledge proofs are a way of proving something is true, without
        revealing details of how you know it is true. It is a bit mind bending,
        but I find the Cave example is the best way of explaining it.
      </p>

      <p>
        Image that you have a circular cave, with the same entry and exit. But,
        on the far side of the cave is a magic door that requires a secret to
        open. If someone can go down one side of the cave and come out the other
        side, it is pretty conclusive evidence that they know the secret
        password. If you watched someone do this from outside the cave and knew
        this cave required a secret password to get through, you now know that
        this person knows the secret password to the door, but you gain no
        knowledge of what the secret they used is. This is a Zero Knowledge
        proof, where the prover can verify something is true, without gaining
        any knowledge about how they know it&apos;s true.
      </p>

      <p>
        Some very smart people have found ways to replicate this same Zero
        Knowledge gained proving model, while making it arbitrarily
        programmable. How ZK proofs work is out of scope for this write-up, but
        it is important to know what they are. Combing ZK Proofs with hash
        functions is about ~90% of how{" "}
        <span className="text-primary">commbank.eth</span> is able to facilitate
        private payments.
      </p>

      <p>
        A hash function is just a function that for a given input, always
        returns a unique, fixed-length output. A strong hash function is one
        that has a low collision rate, meaning that for a given input, it is
        almost a mathematical certainty that it will have a unique output. Hash
        functions are also normally information losing, or &apos;trap
        doors&apos;. Once you hash something, there is no way to go back to the
        original value you hashed without brute forcing until you find a match.
      </p>

      <p>
        <span className="text-primary">commbank.eth</span> uses Zero Knowledge
        proofs to allow its users to prove they know how to recreate publicly
        recorded and stored hash output values, but without revealing any
        details about the hash itself, or which hash they&apos;re proving.
      </p>

      <h6 className="text-lg text-amber-500">Deposits</h6>

      <p>
        When a user wants to deposit to{" "}
        <span className="text-primary">commbank.eth</span>, they create a note.
        A note contains:
      </p>

      <p>
        <li>The ID asset they are depositing</li>
        <li>The amount of the asset that they are depositing</li>
        <li>A secret, randomly generated number</li>
        <li>The address of the owner of the note</li>
      </p>

      <p>A note can be committed to by hashing it&apos;s contents, i.e.</p>

      <code>note_hash = hash(asset_id, asset_amount, secret, owner)</code>

      <p>
        When the user deposits, the asset and amount that they are depositing is
        transferred to <span className="text-primary">commbank.eth</span>, with
        the user providing the note hash too. This note hash is validated with a
        Zero Knowledge proof, which verifies that the note_hash does actually
        equal the amount and asset publicly deposited, or the transaction fails.
      </p>

      <p>
        If the users proof is valid, their note hash is added as a leaf to the{" "}
        <span className="text-primary">commbank.eth</span> Merkle Tree. A Merkle
        Tree is a very handy data structure, it is a way of expressing a lot of
        data in a single hash. It works by hashing (often) pairs, level by
        level, until the top level is reached. This top level is called the root
        hash, and can only be created by recreating all of the hashes that came
        before it.
      </p>

      <h6 className="text-lg text-amber-500">Transfers</h6>

      <p>
        A transfer in <span className="text-primary">commbank.eth</span> occurs
        when at least 1 note is spent, and at least 1 note is created.
      </p>

      <p>
        Say Alice has a note A with a value of $10. She wishes to send Bob $6.
        To do this, she takes her Note A as an input note, and creates 2 output
        notes, one for $6 belonging to Bob, and one for $4 to herself as change.
        The most important part of the transfer process is ensuring that the sum
        of asset inputs = the sum of asset outputs. Alice also proves:
      </p>

      <p>
        <li>
          She knows some hash leaf value that is contained within a recent
          merkle root
        </li>
        <li>
          She knows some secret that when hashed = the owner value on the note
        </li>
      </p>

      <p>
        Alice&apos;s input notes are marked as spent by recording their
        nullifier. In <span className="text-primary">commbank.eth</span>&apos;s
        case - the nullifier hash is given by:{" "}
      </p>

      <code>nullifier_hash = hash(leaf_index, secret, amount, asset)</code>

      <p>
        This nullifier property makes double spending of notes impossible, as
        for a given note_hash there is only one nullifier_hash output.
      </p>

      <h6 className="text-lg text-amber-500">Withdrawals</h6>

      <p>
        Withdrawals are the exact same as transfers, but they do not create any
        output notes. The sum of the input notes must equal the sum of the
        withdrawal amount, and the nullifiers are recorded just the same as
        transfers.
      </p>
    </main>
  );
}
