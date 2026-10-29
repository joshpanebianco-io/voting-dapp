import { Link } from "react-router-dom";
import { ADDRESSES, APP_TAGLINE, CHAIN, LINKS } from "../../config";
import { AddressChip } from "../ui/AddressChip";
import { Logo } from "../ui/Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-edge bg-surface/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">
            {APP_TAGLINE} Polls and ballots live entirely on the {CHAIN.name} test network; nothing is stored off-chain.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link to="/polls" className="hover:text-fg">
                Active polls
              </Link>
            </li>
            <li>
              <Link to="/results" className="hover:text-fg">
                Results
              </Link>
            </li>
            <li>
              <Link to="/create" className="hover:text-fg">
                Create a poll
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-fg">
                How it works
              </Link>
            </li>
            <li>
              <a href={LINKS.repo} target="_blank" rel="noreferrer" className="hover:text-fg">
                Source on GitHub
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">On-chain</h4>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">Network</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                {CHAIN.name}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">PollManager</dt>
              <dd>
                <AddressChip address={ADDRESSES.pollManager} />
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">PollRetriever</dt>
              <dd>
                <AddressChip address={ADDRESSES.pollRetriever} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="border-t border-edge">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Built with React, ethers.js and Solidity. Testnet only: votes carry no real-world weight.</p>
          <p>© {new Date().getFullYear()} DecentraVote</p>
        </div>
      </div>
    </footer>
  );
}
