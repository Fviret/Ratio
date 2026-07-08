"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Decision = {
  id: string;
  title: string;
  decider: string | null;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposée",
  decided: "Décidée",
  revisited: "Revisitée",
  reversed: "Renversée",
};

type SearchResult = Decision & { rank: number };

export function DemoDecisionsList({ decisions }: { decisions: Decision[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await fetch("/api/demo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });
      if (!res.ok) { setResults([]); return; }
      const data = (await res.json()) as { results?: SearchResult[] };
      setResults(data.results ?? []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const displayed = results ?? decisions;
  const isSearchMode = results !== null;

  const maxRank = results && results.length > 0 ? results[0].rank : 1;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) setResults(null);
          }}
          placeholder="Rechercher une décision…"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/50 disabled:opacity-50"
        >
          {searching ? "…" : "Rechercher"}
        </button>
        {isSearchMode && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults(null); }}
            className="rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/50"
          >
            ✕
          </button>
        )}
      </form>

      {isSearchMode && (
        <p className="text-sm text-muted-foreground">
          {displayed.length === 0
            ? "Aucun résultat."
            : `${displayed.length} résultat${displayed.length > 1 ? "s" : ""}`}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {displayed.map((d) => (
          <Link key={d.id} href={`/demo/${d.id}`} className="block group">
            <Card className="transition-colors group-hover:border-foreground/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium leading-snug">
                    {d.title}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-2">
                    {isSearchMode && "rank" in d && (
                      <span className="text-xs text-muted-foreground font-variant-numeric tabular-nums">
                        {Math.round(((d as SearchResult).rank / maxRank) * 100)} %
                      </span>
                    )}
                    <Badge variant="secondary">
                      {STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {d.decider ? `Décidé par ${d.decider}` : "Décideur non renseigné"} ·{" "}
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
