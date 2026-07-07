"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Decision = {
  id: string;
  title: string;
  decider: string | null;
  status: string;
  created_at: string;
};

type SearchResult = Decision & { rank: number };

export function DecisionsList({ decisions }: { decisions: Decision[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as { results?: SearchResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const isSearchMode = query.trim().length > 0;
  const displayed: (Decision | SearchResult)[] =
    isSearchMode && results !== null ? results : decisions;

  const maxRank =
    isSearchMode && results && results.length > 0
      ? Math.max(...results.map((r) => r.rank))
      : 1;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(query);
        }}
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
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {searching ? "Recherche…" : "Rechercher"}
        </button>
      </form>

      {isSearchMode && results !== null && results.length === 0 && !searching && (
        <p className="text-sm text-muted-foreground">
          Aucun résultat pour «&nbsp;{query}&nbsp;».
        </p>
      )}

      {!isSearchMode && decisions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune décision enregistrée pour le moment.
        </p>
      )}

      {displayed.length > 0 && (
        <div className="flex flex-col gap-3">
          {displayed.map((decision) => {
            const rankScore =
              "rank" in decision && maxRank > 0
                ? Math.round(((decision as SearchResult).rank / maxRank) * 100)
                : null;
            return (
              <Link key={decision.id} href={`/decisions/${decision.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{decision.title}</CardTitle>
                      <div className="flex shrink-0 items-center gap-2">
                        {rankScore !== null && (
                          <Badge variant="outline">{rankScore}&nbsp;%</Badge>
                        )}
                        <Badge variant="secondary">{decision.status}</Badge>
                      </div>
                    </div>
                    {decision.decider && (
                      <CardDescription>
                        Décidé par {decision.decider}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {new Date(decision.created_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
