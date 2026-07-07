"use client";

import { useState, useCallback, useMemo, useRef, useTransition } from "react";
import Link from "next/link";
import { linkDecision, unlinkDecision } from "../actions";

export type LinkEntry = {
  sourceId: string;
  targetId: string;
  relation: string;
  relatedId: string;
  relatedTitle: string;
  direction: "forward" | "reverse";
};

type SearchHit = { id: string; title: string; status: string };

const RELATION_LABELS: Record<string, { forward: string; reverse: string }> = {
  supersedes: { forward: "Remplace", reverse: "Remplacée par" },
  relates_to: { forward: "Lié à", reverse: "Lié à" },
  conflicts_with: { forward: "Conflicte avec", reverse: "Conflicte avec" },
};

export function DecisionLinks({
  decisionId,
  links,
}: {
  decisionId: string;
  links: LinkEntry[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [relation, setRelation] = useState("relates_to");
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const linkedIds = useMemo(() => new Set(links.map((l) => l.relatedId)), [links]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results?: SearchHit[] };
        setResults(
          data.results?.filter(
            (r) => r.id !== decisionId && !linkedIds.has(r.id),
          ) ?? [],
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    },
    [decisionId, linkedIds],
  );

  function handleAdd() {
    if (!selected) return;
    const fd = new FormData();
    fd.set("decision_id", decisionId);
    fd.set("related_id", selected.id);
    fd.set("relation", relation);
    startTransition(async () => {
      await linkDecision(fd);
    });
    setSelected(null);
    setQuery("");
    setResults(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Liens existants */}
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun lien pour l&apos;instant.</p>
      )}
      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((link) => {
            const labels = RELATION_LABELS[link.relation] ?? {
              forward: link.relation,
              reverse: link.relation,
            };
            const label =
              link.direction === "forward" ? labels.forward : labels.reverse;
            return (
              <li
                key={`${link.sourceId}-${link.targetId}-${link.relation}`}
                className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {label}
                  </span>
                  <Link
                    href={`/decisions/${link.relatedId}`}
                    className="truncate font-medium hover:underline underline-offset-2"
                  >
                    {link.relatedTitle}
                  </Link>
                </div>
                <form action={unlinkDecision}>
                  <input type="hidden" name="decision_id" value={link.sourceId} />
                  <input type="hidden" name="related_id" value={link.targetId} />
                  <input type="hidden" name="relation" value={link.relation} />
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Retirer
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {/* Formulaire d'ajout */}
      <div className="flex flex-col gap-2 rounded-md border border-dashed border-input p-3">
        <p className="text-sm font-medium">Ajouter un lien</p>
        <div className="flex gap-2">
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="relates_to">Lié à</option>
            <option value="supersedes">Remplace</option>
            <option value="conflicts_with">Conflicte avec</option>
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setSelected(null);
              void runSearch(e.target.value);
            }}
            placeholder="Rechercher une décision…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {selected && (
          <div className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-1.5 text-sm">
            <span className="truncate">{selected.title}</span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        )}

        {!selected && results !== null && results.length > 0 && (
          <ul className="flex flex-col gap-0.5 rounded-md border border-input bg-background p-1">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setQuery(r.title);
                    setResults(null);
                  }}
                  className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent/50"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!selected && results !== null && results.length === 0 && !searching && query.trim() && (
          <p className="text-xs text-muted-foreground">Aucun résultat.</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected || isPending}
          className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}
