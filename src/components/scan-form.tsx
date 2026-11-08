import { useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTarget } from "@/lib/target";

const EXAMPLES = [
  "linear.app",
  "raycast.com",
  "shadcn-landing-page.vercel.app",
];

export const ScanForm = ({
  initial = "",
  examples = true,
}: {
  initial?: string;
  examples?: boolean;
}) => {
  const navigate = useNavigate();
  const id = useId();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const go = (raw: string) => {
    try {
      const { slug } = parseTarget(raw);
      setError(null);
      setInput(slug);
      void navigate({ to: "/scan/$", params: { _splat: slug } });
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "Enter a web address, like linear.app."
      );
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(input);
  };

  return (
    <div className="flex flex-col gap-3">
      <form className="flex flex-wrap gap-2" onSubmit={onSubmit} noValidate>
        <label className="sr-only" htmlFor={id}>
          Website URL
        </label>
        <Input
          id={id}
          name="url"
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="yoursite.com"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 basis-40"
        />
        <Button type="submit" size="lg">
          Score it
        </Button>
      </form>
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
      {examples && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="text-link"
              onClick={() => go(example)}
            >
              {example}
            </button>
          ))}
        </p>
      )}
    </div>
  );
};
