"use client";

import { useState } from "react";
import { createDecision } from "../actions";
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

type DecisionCandidate = {
  title: string;
  context: string;
  options: string;
  decision_text: string;
  rationale: string;
  decider: string;
  stakeholders: string[];
};

type Extraction = DecisionCandidate & { source_raw: string };

type ExtractResponse =
  | { error: string }
  | {
      status: "decision_found" | "no_clear_decision" | "multiple_decisions";
      message: string;
      decisions: DecisionCandidate[];
    };

export default function NewDecisionPage() {
  const [threadText, setThreadText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractInfo, setExtractInfo] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<DecisionCandidate[] | null>(
    null,
  );
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [formKey, setFormKey] = useState(0);

  function selectCandidate(candidate: DecisionCandidate) {
    setExtraction({ ...candidate, source_raw: threadText.trim() });
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
              />
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
