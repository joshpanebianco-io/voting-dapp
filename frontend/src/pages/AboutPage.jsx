import {
  ArrowTopRightOnSquareIcon,
  CubeTransparentIcon,
  EyeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "../components/layout/Layout";
import { AddressChip } from "../components/ui/AddressChip";
import { Card } from "../components/ui/Card";
import { ADDRESSES, CHAIN, LINKS } from "../config";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const BENEFITS = [
  {
    icon: CubeTransparentIcon,
    title: "Decentralised",
    text: "Poll data lives on a public network rather than a company database, so no single operator can alter or withhold the results.",
  },
  {
    icon: EyeIcon,
    title: "Transparent and auditable",
    text: "Every poll, ballot and vote is a public transaction. Anyone can recount the tally directly from the chain.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Tamper-resistant",
    text: "Changing a recorded vote would require rewriting Ethereum history, which is economically and cryptographically impractical.",
  },
  {
    icon: LockClosedIcon,
    title: "Immutable",
    text: "Once confirmed, a vote cannot be edited or deleted. The record is as permanent as the network itself.",
  },
  {
    icon: FingerPrintIcon,
    title: "One address, one vote",
    text: "A soulbound ballot NFT is issued per registration and destroyed on voting, so an address can never vote twice.",
  },
  {
    icon: UserGroupIcon,
    title: "Pseudonymous",
    text: "Voters are identified by wallet address only. Real identities are never collected or stored.",
  },
];

const CASES = [
  {
    title: "Sierra Leone presidential election",
    year: "2018",
    text: "A blockchain platform was used to independently record and verify tallies from polling stations in the Western District, demonstrating real-time auditability alongside the official count.",
  },
  {
    title: "West Virginia, United States",
    year: "2018–2020",
    text: "Deployed military and overseas voters cast ballots through the blockchain-backed Voatz mobile app in federal and state elections.",
  },
  {
    title: "Utah County, United States",
    year: "2020",
    text: "Military and overseas voters used Voatz in primary and general elections, with ballots anchored to a blockchain for integrity checks.",
  },
  {
    title: "Moscow constitutional referendum",
    year: "2020",
    text: "Parts of Russia's constitutional amendment vote were run on a blockchain-based remote voting system for registered residents.",
  },
];

export function AboutPage() {
  useDocumentTitle("About");
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="About"
        title="Why run a vote on a blockchain?"
        description="DecentraVote is a learning project that puts a complete poll lifecycle on Ethereum: creation, registration, voting and results, with no server in between."
      />

      <section>
        <h2 className="text-xl font-bold tracking-tight">What the chain gives you</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item) => (
            <Card key={item.title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Under the hood</h2>
          <p className="mt-2 text-sm text-muted">Three small Solidity contracts do all the work.</p>
          <ol className="mt-6 space-y-4">
            <Step n="1" title="PollManager">
              Stores polls, enforces the rules (deadline, one vote per address, valid options) and emits events for every
              action. Deploys its own ballot contract.
            </Step>
            <Step n="2" title="BallotNFT">
              An ERC-721 token that cannot be transferred or approved. Minted when you register for a poll, burned when
              you vote. Only PollManager may mint or burn.
            </Step>
            <Step n="3" title="PollRetriever">
              A read-only helper that returns whole lists of polls in a single call so the interface loads quickly.
            </Step>
          </ol>
        </div>
        <Card className="self-start">
          <h3 className="font-semibold">Deployed contracts</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Network</dt>
              <dd className="font-medium">{CHAIN.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">PollManager</dt>
              <dd>
                <AddressChip address={ADDRESSES.pollManager} chars={6} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">PollRetriever</dt>
              <dd>
                <AddressChip address={ADDRESSES.pollRetriever} chars={6} />
              </dd>
            </div>
          </dl>
          <a
            href={LINKS.repo}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Read the source on GitHub
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
          <p className="mt-5 text-xs text-muted">
            Built with React, Vite, Tailwind CSS, ethers.js, Solidity, OpenZeppelin and Hardhat.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold tracking-tight">Blockchain voting in the real world</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Pilots so far have been small and not without criticism, but they show the direction of travel.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {CASES.map((item) => (
            <li key={item.title}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className="shrink-0 font-mono text-xs text-muted">{item.year}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-semibold text-muted">
        {n}
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}
