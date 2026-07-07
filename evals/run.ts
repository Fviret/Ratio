import { extractDecisions } from "../src/lib/extract";
import { EVAL_CASES, type ExpectedDecisionCheck } from "./threads";

function checkDecision(
  decision: { decision_text: string; decider: string },
  check: ExpectedDecisionCheck,
): string[] {
  const failures: string[] = [];

  for (const needle of check.decisionTextContains ?? []) {
    if (!decision.decision_text.toLowerCase().includes(needle.toLowerCase())) {
      failures.push(`decision_text ne contient pas "${needle}"`);
    }
  }

  if (
    check.deciderContains &&
    !decision.decider.toLowerCase().includes(check.deciderContains.toLowerCase())
  ) {
    failures.push(`decider ne contient pas "${check.deciderContains}"`);
  }

  return failures;
}

async function main() {
  let passed = 0;
  const results: { id: string; ok: boolean; details: string[] }[] = [];

  for (const testCase of EVAL_CASES) {
    const details: string[] = [];
    let ok = true;

    try {
      const result = await extractDecisions(testCase.text);

      if (result.status !== testCase.expected.status) {
        ok = false;
        details.push(
          `status attendu "${testCase.expected.status}", obtenu "${result.status}"`,
        );
      }

      if (result.decisions.length !== testCase.expected.decisionsCount) {
        ok = false;
        details.push(
          `${testCase.expected.decisionsCount} décision(s) attendue(s), ${result.decisions.length} obtenue(s)`,
        );
      }

      const checks = testCase.expected.checks ?? [];
      checks.forEach((check, i) => {
        const decision = result.decisions[i];
        if (!decision) return;
        const failures = checkDecision(decision, check);
        if (failures.length > 0) {
          ok = false;
          details.push(`décision #${i + 1} : ${failures.join(", ")}`);
        }
      });
    } catch (error) {
      ok = false;
      details.push(
        `erreur pendant l'extraction : ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (ok) passed++;
    results.push({ id: testCase.id, ok, details });

    console.log(`${ok ? "✅" : "❌"} ${testCase.id}`);
    for (const detail of details) {
      console.log(`   - ${detail}`);
    }
  }

  console.log(`\n${passed}/${EVAL_CASES.length} threads réussis`);

  if (passed < EVAL_CASES.length) {
    process.exitCode = 1;
  }
}

main();
