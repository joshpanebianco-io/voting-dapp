import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { PageHeader } from "../components/layout/Layout";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { CHAIN, LIMITS } from "../config";
import { usePolls } from "../context/PollsContext";
import { useWallet } from "../context/WalletContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useTransaction } from "../hooks/useTransaction";
import { cn } from "../lib/cn";
import { getPollManager } from "../lib/contracts";
import { formatMinutes } from "../lib/format";
import { pollIdFromReceipt } from "../lib/polls";

const PRESETS = [
  { label: "15 min", value: 15, unit: "minutes" },
  { label: "1 hour", value: 1, unit: "hours" },
  { label: "24 hours", value: 24, unit: "hours" },
  { label: "7 days", value: 7, unit: "days" },
];

const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };

export function CreatePollPage() {
  useDocumentTitle("Create a poll");
  const navigate = useNavigate();
  const wallet = useWallet();
  const { refresh } = usePolls();
  const tx = useTransaction();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [durationValue, setDurationValue] = useState("24");
  const [durationUnit, setDurationUnit] = useState("hours");
  const [touched, setTouched] = useState(false);

  const durationMinutes = Math.round(Number(durationValue) * UNIT_MINUTES[durationUnit]);

  const errors = useMemo(() => {
    const result = { options: [] };
    const trimmedTitle = title.trim();
    if (!trimmedTitle) result.title = "Give your poll a title.";
    else if (new TextEncoder().encode(trimmedTitle).length > LIMITS.maxNameLength) {
      result.title = `Keep the title under ${LIMITS.maxNameLength} characters.`;
    }

    const seen = new Map();
    options.forEach((option, index) => {
      const value = option.trim();
      if (!value) result.options[index] = "Option text is required.";
      else if (new TextEncoder().encode(value).length > LIMITS.maxOptionLength) {
        result.options[index] = `Keep options under ${LIMITS.maxOptionLength} characters.`;
      } else if (seen.has(value.toLowerCase())) result.options[index] = "Options must be unique.";
      seen.set(value.toLowerCase(), index);
    });

    if (!Number.isFinite(durationMinutes) || durationMinutes < LIMITS.minDurationMinutes) {
      result.duration = "The poll must run for at least one minute.";
    } else if (durationMinutes > LIMITS.maxDurationMinutes) {
      result.duration = "The poll cannot run for more than a year.";
    }
    return result;
  }, [title, options, durationMinutes]);

  const isValid = !errors.title && !errors.duration && errors.options.every((e) => !e);

  const updateOption = (index, value) => setOptions((list) => list.map((o, i) => (i === index ? value : o)));
  const addOption = () => options.length < LIMITS.maxOptions && setOptions((list) => [...list, ""]);
  const removeOption = (index) => options.length > LIMITS.minOptions && setOptions((list) => list.filter((_, i) => i !== index));

  const applyPreset = (preset) => {
    setDurationValue(String(preset.value));
    setDurationUnit(preset.unit);
  };

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid || !wallet.canTransact) return;

    const name = title.trim();
    const cleanOptions = options.map((o) => o.trim());

    await tx.run(
      async () => {
        const manager = getPollManager(await wallet.getSigner());
        return manager.createPoll(name, cleanOptions, durationMinutes);
      },
      {
        pending: "Creating your poll…",
        success: "Poll created and live.",
        onSuccess: async (receipt) => {
          const manager = getPollManager();
          const pollId = await pollIdFromReceipt(receipt, manager);
          await refresh();
          navigate(`/polls/${pollId}`);
        },
      },
    );
  };

  const previewOptions = options.map((o) => o.trim()).filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create a poll"
        description="One transaction publishes the poll. Once it is live the title, options and deadline cannot be changed."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <Card as="form" onSubmit={submit} noValidate className="space-y-7">
          <Field
            label="Title"
            htmlFor="poll-title"
            error={touched && errors.title}
            counter={`${title.trim().length}/${LIMITS.maxNameLength}`}
            hint="Ask a single, clear question."
          >
            <Input
              id="poll-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Which feature should we build next?"
              maxLength={LIMITS.maxNameLength}
              invalid={touched && Boolean(errors.title)}
              autoFocus
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Options</p>
              <span className="font-mono text-xs text-muted">
                {options.length}/{LIMITS.maxOptions}
              </span>
            </div>
            <ul className="space-y-2.5">
              {options.map((option, index) => (
                <li key={index}>
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 w-5 shrink-0 text-center font-mono text-xs text-muted">{index + 1}</span>
                    <div className="flex-1">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={LIMITS.maxOptionLength}
                        invalid={touched && Boolean(errors.options[index])}
                        aria-label={`Option ${index + 1}`}
                      />
                      {touched && errors.options[index] && (
                        <p className="mt-1 text-sm text-danger" role="alert">
                          {errors.options[index]}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= LIMITS.minOptions}
                      aria-label={`Remove option ${index + 1}`}
                      className="mt-0.5 text-muted"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              onClick={addOption}
              disabled={options.length >= LIMITS.maxOptions}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add option
            </Button>
          </div>

          <Field label="Duration" htmlFor="poll-duration" error={touched && errors.duration} hint="Voting closes automatically when the time is up. The creator can also close it early.">
            <div className="flex flex-wrap gap-2 pb-2">
              {PRESETS.map((preset) => {
                const active = String(preset.value) === durationValue && preset.unit === durationUnit;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      active ? "border-accent bg-accent/10 text-accent" : "border-edge text-muted hover:border-muted/60 hover:text-fg",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                id="poll-duration"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                invalid={touched && Boolean(errors.duration)}
                className="w-32"
              />
              <Select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} aria-label="Duration unit" className="w-36">
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </Select>
            </div>
          </Field>

          <div className="border-t border-edge pt-6">
            {!wallet.isConnected ? (
              <Button type="button" size="lg" className="w-full" onClick={wallet.connect} loading={wallet.isConnecting}>
                Connect wallet to create
              </Button>
            ) : !wallet.isCorrectNetwork ? (
              <Button type="button" size="lg" className="w-full" onClick={wallet.switchNetwork} loading={wallet.switching}>
                Switch to {CHAIN.name} to create
              </Button>
            ) : (
              <Button type="submit" size="lg" className="w-full" loading={tx.busy} disabled={touched && !isValid} data-testid="create-submit">
                {tx.status === "signing" ? "Confirm in wallet…" : tx.status === "pending" ? "Publishing poll…" : "Publish poll"}
              </Button>
            )}
            {tx.status === "error" && tx.error && (
              <p className="mt-3 text-sm text-danger" role="alert">
                {tx.error}
              </p>
            )}
            {wallet.isConnected && wallet.lowBalance && (
              <p className="mt-3 text-xs text-warning">
                Your balance looks too low to pay for gas.{" "}
                <button type="button" className="font-medium underline" onClick={() => wallet.setFaucetOpen(true)}>
                  Get test {CHAIN.currency.symbol}
                </button>
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <div className="flex items-center justify-between">
              <Badge variant="accent">Preview</Badge>
              <span className="text-xs text-muted">{Number.isFinite(durationMinutes) && durationMinutes > 0 ? `Runs ${formatMinutes(durationMinutes)}` : "—"}</span>
            </div>
            <p className={cn("mt-3 break-words text-base font-semibold leading-snug", !title.trim() && "text-muted/60")}>
              {title.trim() || "Your poll title"}
            </p>
            <ul className="mt-4 space-y-2">
              {(previewOptions.length ? previewOptions : ["Option 1", "Option 2"]).map((option, index) => (
                <li key={index} className={cn("flex items-center gap-2.5 text-sm", !previewOptions.length && "text-muted/60")}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-edge bg-surface-2" aria-hidden="true" />
                  <span className="break-words">{option}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="text-sm">
            <h3 className="font-semibold">Good to know</h3>
            <ul className="mt-3 space-y-2.5 text-muted">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Creating a poll costs a little gas on {CHAIN.name}; test ETH is free from faucets.
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Anyone with a wallet can register and vote once per poll.
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Polls are public and permanent. Avoid personal or sensitive information.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
