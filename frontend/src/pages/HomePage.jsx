import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ClockIcon,
  CubeTransparentIcon,
  DocumentCheckIcon,
  FireIcon,
  TicketIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { CHAIN } from "../config";
import { usePolls } from "../context/PollsContext";
import { useWallet } from "../context/WalletContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNow } from "../hooks/useNow";
import { isPollOpen } from "../lib/polls";
import { PollCard } from "../components/polls/PollCard";
import { PollResults } from "../components/polls/PollResults";
import { PollStatusBadge } from "../components/polls/PollStatusBadge";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PollCardSkeleton, Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";

const STEPS = [
  {
    icon: WalletIcon,
    title: "Connect",
    text: `Connect a browser wallet on the ${CHAIN.name} test network. Browsing polls and results needs no wallet at all.`,
  },
  {
    icon: TicketIcon,
    title: "Register",
    text: "Registering for a poll mints a soulbound ballot NFT to your address. It cannot be sold, moved or duplicated.",
  },
  {
    icon: CheckBadgeIcon,
    title: "Vote",
    text: "Casting your vote burns the ballot and increments the tally in the contract. One address, one vote, forever auditable.",
  },
];

export function HomePage() {
  useDocumentTitle("");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Legacy links looked like /?pollId=12
  useEffect(() => {
    const legacy = params.get("pollId");
    if (legacy) navigate(`/polls/${legacy}`, { replace: true });
  }, [params, navigate]);

  return (
    <div className="space-y-20 sm:space-y-24">
      <Hero />
      <Stats />
      <HowItWorks />
      <LatestPolls />
      <CallToAction />
    </div>
  );
}

function Hero() {
  const { polls, status } = usePolls();
  const now = useNow();
  const showcase = polls.find((p) => isPollOpen(p, now)) || polls[0] || null;

  return (
    <section className="relative -mx-4 -mt-8 overflow-hidden px-4 pb-4 pt-12 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-10 lg:px-8 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up">
          <Badge variant="accent" dot pulse size="md">
            Live on the {CHAIN.name} test network
          </Badge>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Transparent polls.
            <br />
            <span className="bg-gradient-to-r from-accent to-[#7c3aed] bg-clip-text text-transparent">Verifiable votes.</span>
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted">
            Create a poll in seconds, hand every participant a one-time ballot, and let Ethereum count the votes. No
            administrators, no edits, no hidden tallies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" to="/polls" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
              Browse polls
            </Button>
            <Button size="lg" variant="outline" to="/create">
              Create a poll
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="text-muted">Tamper-proof</dt>
              <dd className="mt-1 font-semibold">Results on-chain</dd>
            </div>
            <div>
              <dt className="text-muted">One vote each</dt>
              <dd className="mt-1 font-semibold">Soulbound ballots</dd>
            </div>
            <div>
              <dt className="text-muted">Open to all</dt>
              <dd className="mt-1 font-semibold">Free testnet gas</dd>
            </div>
          </dl>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-[#7c3aed]/20 blur-2xl" aria-hidden="true" />
          {status === "loading" ? (
            <Card className="relative">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="mt-4 h-6 w-3/4" />
              <div className="mt-6 space-y-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ) : showcase ? (
            <Card className="relative">
              <div className="flex items-center justify-between">
                <PollStatusBadge poll={showcase} />
                <span className="text-xs font-medium text-muted">{isPollOpen(showcase, now) ? "Live tally" : "Final result"}</span>
              </div>
              <Link to={`/polls/${showcase.id}`} className="mt-3 block text-lg font-semibold leading-snug tracking-tight hover:text-accent">
                {showcase.name}
              </Link>
              <PollResults poll={showcase} open={isPollOpen(showcase, now)} limit={4} className="mt-5" />
              <div className="mt-5 flex items-center justify-between border-t border-edge pt-4 text-sm">
                <span className="text-muted">
                  {showcase.totalVotes} {showcase.totalVotes === 1 ? "vote" : "votes"} · {showcase.options.length} options
                </span>
                <Link to={`/polls/${showcase.id}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                  Open poll <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="relative">
              <Badge variant="accent">Example</Badge>
              <p className="mt-3 text-lg font-semibold tracking-tight">Where should the team offsite be?</p>
              <PollResults
                poll={{ options: ["Lisbon", "Kyoto", "Mexico City"], voteCounts: [14, 9, 5], totalVotes: 28 }}
                open={false}
                className="mt-5"
              />
              <p className="mt-5 border-t border-edge pt-4 text-sm text-muted">
                No polls yet. Yours could be the first on this network.
              </p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { stats, status } = usePolls();
  const loading = status === "loading";
  return (
    <section aria-label="Network statistics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Polls created" value={stats.total.toLocaleString()} icon={DocumentCheckIcon} loading={loading} />
        <StatCard label="Active now" value={stats.active.toLocaleString()} icon={FireIcon} loading={loading} />
        <StatCard label="Votes cast" value={stats.votes.toLocaleString()} icon={ChartBarIcon} loading={loading} />
        <StatCard label="Closed polls" value={stats.closed.toLocaleString()} icon={ClockIcon} loading={loading} />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section>
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">How it works</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Three steps, every one of them on-chain</h2>
        <p className="mt-2 text-muted">
          The flow is deliberately simple. The guarantees come from the contract, not from trust in whoever runs the
          website.
        </p>
      </div>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Card className="h-full">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LatestPolls() {
  const { polls, status, voterStatus } = usePolls();
  const { account } = useWallet();
  const now = useNow();
  const latest = [...polls].sort((a, b) => Number(isPollOpen(b, now)) - Number(isPollOpen(a, now)) || b.id - a.id).slice(0, 3);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Latest</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Recent polls</h2>
        </div>
        <Button variant="ghost" to="/polls" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
          View all
        </Button>
      </div>
      <div className="mt-6">
        {status === "loading" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <PollCardSkeleton key={i} />
            ))}
          </div>
        ) : latest.length === 0 ? (
          <EmptyState
            icon={CubeTransparentIcon}
            title="No polls on this network yet"
            description="Be the first: create a poll and share the link."
            action={<Button to="/create">Create a poll</Button>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((poll) => (
              <PollCard key={poll.id} poll={poll} status={voterStatus[poll.id]} account={account} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="overflow-hidden rounded-3xl border border-edge bg-gradient-to-br from-accent to-[#6d28d9] p-8 text-white shadow-pop sm:p-12">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to put a decision on-chain?</h2>
          <p className="mt-2 max-w-lg text-white/80">
            Polls take one transaction to create and close automatically when their time is up.
          </p>
        </div>
        <Button size="lg" variant="inverse" to="/create">
          Create a poll
        </Button>
      </div>
    </section>
  );
}
