"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 p-6 gap-4">
      <Link href="/" className="text-blue-300 hover:underline">
        {" < "}Back to home page
      </Link>
      <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
        commbank.eth explained
      </h2>
      <h6 className="text-xl text-amber-500">Foreword/Legal Disclaimer</h6>
      <p>
        The following is a detailed explanation of how{" "}
        <span className="text-primary">commbank.eth</span> enables private
        transfers of assets on public computer networks.
      </p>
      <p>
        <span className="text-primary">commbank.eth</span> private transfers are
        currently only enabled for me (meaning only I can deposit real money to
        the encrypted protocol). As you can probably imagine, the ability to
        make money vanish in one spot and appear in another is very attractive
        to those on the other side of the law. It is not impossible to regulate
        and enforce the same compliance regulations we have in the traditional
        finance system in <span className="text-primary">commbank.eth</span>,
        but it is much harder.
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
        imprisoned for this&apos; explanation, let us get into the magic of how{" "}
        <span className="text-primary">commbank.eth</span> works.
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
        This is a noted feature of blockchains/public computers, the fact that
        everyone can see everything means that accountability and transparency
        are much more tangible, but it&apos;s a terrible feature when compared
        to the privacy that our traditional banking system offers. If we could
        all see each others bank balances, the dynamic of society would change
        pretty drastically, and probably not for the better.
      </p>
      <p>
        The adoption of blockchain usage to track assets resembles something
        much larger than the ability to publicly track assets, it represents a
        movement of our current financial system away from requiring middlemen
        to facilitate digital payments.
      </p>
      <p>
        As digital payments have increased exponentially, a handful of very
        powerful corporations have essentially formed a monopoly on how money
        moves. These corporations and the fees that they charge are currently
        quite a political issue in Australia, as it is basically theft. ~1%
        surcharges on all transactions is not a good outcome for anybody except
        these corporations, and contributes even more to the ongoing cost of
        living pressures.
      </p>
      <p>
        But, not all hope is lost. What if we could have the privacy that we
        have with the traditional banking system, but on public computers? Where
        we don&apos;t pay a middleman to facilitate the transaction, we just pay
        for the electricity to process the transaction. This thought experiment
        is the thesis for <span className="text-primary">commbank.eth</span>.
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
        contain the amount and asset publicly deposited, or the transaction
        fails.
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

      <div className="h-[300px] md:h-[400px] relative bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
        >
          <g className="merkle-tree">
            <path
              d="M400 100 L300 200 L400 100 L500 200"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <path
              d="M300 200 L250 300 L300 200 L350 300"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <path
              d="M500 200 L450 300 L500 200 L550 300"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Root node */}
            <circle
              cx="400"
              cy="100"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="400"
              y="105"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Root
            </text>

            {/* Level 1 nodes */}
            <circle
              cx="300"
              cy="200"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="300"
              y="205"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Hash
            </text>

            <circle
              cx="500"
              cy="200"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="500"
              y="205"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Hash
            </text>

            {/* Level 2 nodes */}
            <circle
              cx="250"
              cy="300"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="250"
              y="305"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Note
            </text>

            <circle
              cx="350"
              cy="300"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="350"
              y="305"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Note
            </text>

            <circle
              cx="450"
              cy="300"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="450"
              y="305"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Note
            </text>

            <circle
              cx="550"
              cy="300"
              r="20"
              fill="#292524"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <text
              x="550"
              y="305"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="12"
            >
              Note
            </text>
          </g>

          <rect
            x="600"
            y="350"
            width="120"
            height="60"
            rx="5"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="660"
            y="375"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Note
          </text>
          <text
            x="660"
            y="395"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Hash
          </text>

          <rect
            x="180"
            y="60"
            width="120"
            height="60"
            rx="5"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />

          <text x="240" y="90" textAnchor="middle" fill="#F59E0B" fontSize="12">
            Merkle Root
          </text>

          {/* Arrows */}
          <path
            d="M300 95 L380 95"
            stroke="#F59E0B"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <path
            d="M600 380 L580 380 L580 300 L570 300"
            stroke="#F59E0B"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        </svg>
      </div>

      <h6 className="text-lg text-amber-500">Transfers</h6>
      <p>
        A transfer in <span className="text-primary">commbank.eth</span> occurs
        when at least 1 note is spent, and at least 1 note is created.
      </p>
      <p>
        Say Alice has a Note A with a value of $10. She wishes to send Bob $6.
        To do this, she takes her Note A as an input note, and creates 2 output
        notes, one for $6 belonging to Bob, and one for $4 to herself as change.
        The most important part of the transfer process is ensuring that the sum
        of asset inputs = the sum of asset outputs. For each input note, Alice
        also proves:
      </p>
      <p>
        <li>
          She knows where the public hash of this note fits into the merkle tree
          (by providing the leaf_index, merkle_path and merkle_path_values).
        </li>
        <li>She knows the secret value of the note</li>
        <li>
          She knows some private value that when hashed = the owner address of
          the note
        </li>
      </p>
      <p>
        Alice&apos;s input notes are marked as spent by recording their
        nullifier. In <span className="text-primary">commbank.eth</span>&apos;s
        case - the nullifier hash is given by:{" "}
      </p>
      <code>
        nullifier_hash = hash(leaf_index, note_secret, amount, asset_id)
      </code>
      <p>
        This nullifier property makes double spending of notes impossible, as
        for a given note_hash there is only one nullifier_hash output.
      </p>
      <h6 className="text-lg text-amber-500">Withdrawals</h6>
      <p>
        Withdrawals are the exact same as transfers, but they do not create any
        output notes. The sum of the input notes must equal the sum of the
        withdrawal amount, and the nullifiers are recorded just the same as
        transfers. If the withdrawal proof is valid, the exit amount is
        transferred to the address that the user specifies.
      </p>

      <h6 className="text-2xl text-amber-500">Demonstration Transactions</h6>

      <p>
        <span className="text-primary">commbank.eth</span> v0.1 is currently
        deployed on ethereum mainnet at{" "}
        <a
          href="https://etherscan.io/address/0x31219c05c3556BA1dD301F5e62312A240dfE532B"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          commbank.eth
        </a>
        . I was able to complete a private transaction from one account to
        another, and here&apos;s the receipts.
      </p>

      <p>
        First, I deposited 5 USDC, with an input note hash of{" "}
        <code>
          0x8ddbc096f6b664b4112cd1f19f2be1dcf7df7bdc594eb1baeba384570b3dfe16
        </code>{" "}
        <a
          href="https://etherscan.io/tx/0xaa1bfab80961476fa2ab784e47df1455f0ecbed32f274b36ae1d6d6ae182f2eb"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          in this transaction.
        </a>
      </p>

      <p>
        Next,{" "}
        <a
          href="https://etherscan.io/tx/0x891c3b62a7bd3b052f6542de78ffdd6039725eada84ee06917404c55a3872b57"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          in this transaction,
        </a>{" "}
        I privately transferred another account I control 2 USDC, meaning I
        created 2 new note hashes. One for the transaction of 2 USDC, and the
        other for the &apos;change&apos; note (3 USDC).
      </p>

      <p>
        <li>
          2 USDC Note Hash ={" "}
          <code>
            0x3660c1269e7cb1e2de530abe335aee3465ce8b1d7eaa71db2bc143fda5b1be90
          </code>
        </li>
        <li>
          3 USDC Note Hash ={" "}
          <code>
            0xa940c0a67ae782c42fab3fa32b89e6297509bd3561150d15a8824be44c32cf68
          </code>
        </li>
      </p>

      <p>
        Finally, as the recipient of the 2 USDC note hash, I was able to
        withdraw my 2 USDC back to an unencrypted asset, which happened{" "}
        <a
          href="https://etherscan.io/tx/0xbb2bd8baae882d22a19c69c1c7aa13751144440e67881b44591f47a46469e75f"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          in this transaction,
        </a>
      </p>

      <p>
        If not for me revealing the details of these transactions (and if I
        wasn&apos;t the only account interacting with{" "}
        <span className="text-primary">commbank.eth</span>), all of the details
        of my transfer of 2 USDC would be private.
      </p>

      <h6 className="text-2xl text-amber-500">Conclusion</h6>

      <p>
        If you&apos;ve made it this far, thanks for reading.{" "}
        <a
          href="https://x.com/0xbenhooper"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Follow me on twitter
        </a>{" "}
        for updates on the project, and be sure to{" "}
        <a
          href="https://github.com/hooperben/commbank.eth"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          check out the codebase
        </a>{" "}
        if you&apos;re into that kind of thing.
      </p>

      <p>cheers 🤙</p>

      <p className="mb-6"></p>

      <Link href="/" className="text-blue-300 hover:underline">
        back to home page
      </Link>
    </main>
  );
}
