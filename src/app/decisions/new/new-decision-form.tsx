"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createDecision } from "../actions";
import type { DecisionCandidate, ExtractionResult } from "@/lib/extract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DuplicateHit = { id: string; title: string; status: string };

type Extraction = DecisionCandidate & { source_raw: string };

type ExtractResponse = { error: string } | ExtractionResult;

export function NewDecisionForm() {
  const [threadText, setThreadText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractInfo, setExtractInfo] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<DecisionCandidate[] | null>(
    null,
  );
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [titleValue, setTitleValue] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateHit[] | null>(null);
  const duplicateAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = titleValue.trim();
    if (trimmed.length < 3) return;
    const timer = setTimeout(async () => {
      duplicateAbortRef.current?.abort();
      const controller = new AbortController();
      duplicateAbortRef.current = controller;
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });
        if (!res.ok) { setDuplicates(null); return; }
        const data = (await res.json()) as { results?: DuplicateHit[] };
        setDuplicates(data.results?.slice(0, 3) ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setDuplicates(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [titleValue]);

  function selectCandidate(candidate: DecisionCandidate) {
    setExtraction({ ...candidate, source_raw: threadText.trim() });
    setTitleValue(candidate.title ?? "");
    setFormKey((k) => k + 1);
    setCandidates(null);
  }

  async function handleExtract() {
    const text = threadText.trim();
    if (!text) return;

    setExtracting(true);
    setExtractError(null);
    setExtractInfo(null);
    setCandidates(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: ExtractResponse = await res.json();

      if (!res.ok || "error" in data) {
        setExtractError(
          "error" in data ? data.error : "Erreur lors de l'extraction.",
        );
        return;
      }

      if (data.status === "no_clear_decision") {
        setExtractInfo(
          data.message || "Aucune décision claire n'a été trouvée dans ce thread.",
        );
        return;
      }

      if (data.status === "multiple_decisions") {
        setExtractInfo(
          data.message ||
            `${data.decisions.length} décisions distinctes ont été trouvées — choisis celle à enregistrer.`,
        );
        setCandidates(data.decisions);
        return;
      }

      selectCandidate(data.decisions[0]);
    } catch {
      setExtractError("Erreur réseau lors de l'extraction.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Coller un thread</CardTitle>
          <CardDescription>
            Colle un thread Teams/Slack — une fiche décision est extraite
            automatiquement, à éditer avant de l&apos;enregistrer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            rows={6}
            value={threadText}
            onChange={(e) => setThreadText(e.target.value)}
            placeholder="Colle le thread ici..."
          />
          <Button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !threadText.trim()}
          >
            {extracting ? "Extraction en cours..." : "Extraire la décision"}
          </Button>
          {extractError && (
            <p className="text-sm text-destructive">{extractError}</p>
          )}
          {extractInfo && (
            <p className="text-sm text-muted-foreground">{extractInfo}</p>
          )}
        </CardContent>
      </Card>

      {candidates && candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisis la décision à enregistrer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {candidates.map((candidate, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectCandidate(candidate)}
                className="rounded-lg border border-input p-3 text-left transition-colors hover:bg-accent/50"
              >
                <p className="font-medium">{candidate.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {candidate.decision_text}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle décision</CardTitle>
          <CardDescription>
            {extraction
              ? "Vérifie et édite la fiche extraite avant d'enregistrer."
              : "Ou remplis directement le formulaire à la main."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={formKey} action={createDecision} className="flex flex-col gap-4">
            <input
              type="hidden"
              name="source_raw"
              defaultValue={extraction?.source_raw ?? ""}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Titre
              </label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={extraction?.title ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitleValue(val);
                  if (val.trim().length < 3) setDuplicates(null);
                }}
              />
              {duplicates !== null && duplicates.length > 0 && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-700 dark:bg-yellow-950">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Des décisions similaires existent déjà — vérifie avant d&apos;enregistrer.
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {duplicates.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/decisions/${d.id}`}
                          target="_blank"
                          className="text-yellow-700 underline underline-offset-2 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
                        >
                          {d.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="context" className="text-sm font-medium">
                Contexte — pourquoi maintenant ?
              </label>
              <Textarea
                id="context"
                name="context"
                rows={3}
                defaultValue={extraction?.context ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="options" className="text-sm font-medium">
                Options envisagées (avantages / inconvénients)
              </label>
              <Textarea
                id="options"
                name="options"
                rows={3}
                defaultValue={extraction?.options ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision_text" className="text-sm font-medium">
                Décision
              </label>
              <Textarea
                id="decision_text"
                name="decision_text"
                rows={2}
                defaultValue={extraction?.decision_text ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="rationale" className="text-sm font-medium">
                Rationale — le pourquoi
              </label>
              <Textarea
                id="rationale"
                name="rationale"
                rows={2}
                defaultValue={extraction?.rationale ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decider" className="text-sm font-medium">
                Décideur
              </label>
              <Input
                id="decider"
                name="decider"
                defaultValue={extraction?.decider ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stakeholders" className="text-sm font-medium">
                Stakeholders (séparés par des virgules)
              </label>
              <Input
                id="stakeholders"
                name="stakeholders"
                defaultValue={extraction?.stakeholders?.join(", ") ?? ""}
              />
            </div>

            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
