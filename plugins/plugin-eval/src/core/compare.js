import { createComparisonNextAction } from "./presentation.js";

export function compareResults(before, after) {
  const scoreComparable = (before.summary.assessment?.method || "legacy-v1") ===
    (after.summary.assessment?.method || "legacy-v1");
  const budgetComparable = (before.budgets.measurement?.version || 1) === (after.budgets.measurement?.version || 1);
  const beforeFailures = new Set(
    before.checks.filter((check) => check.status === "fail").map((check) => check.id),
  );
  const afterFailures = new Set(
    after.checks.filter((check) => check.status === "fail").map((check) => check.id),
  );

  const resolvedFailures = [...beforeFailures].filter((id) => !afterFailures.has(id));
  const newFailures = [...afterFailures].filter((id) => !beforeFailures.has(id));

  const payload = {
    kind: "comparison",
    createdAt: new Date().toISOString(),
    target: after.target,
    additionalContextPaths: after.additionalContextPaths || [],
    scoreComparable,
    comparisonNote: scoreComparable ? null : "Grading methods differ; score changes cannot be attributed to plugin changes.",
    scoreDelta: scoreComparable ? after.summary.score - before.summary.score : null,
    budgetComparable,
    budgetComparisonNote: budgetComparable ? null : "Budget measurement definitions differ; inventory deltas are not comparable.",
    gradeBefore: before.summary.grade,
    gradeAfter: after.summary.grade,
    riskBefore: before.summary.riskLevel,
    riskAfter: after.summary.riskLevel,
    budgetDelta: {
      trigger_cost_tokens:
        budgetComparable ? (after.budgets.trigger_cost_tokens?.value || 0) - (before.budgets.trigger_cost_tokens?.value || 0) : null,
      invoke_cost_tokens:
        budgetComparable ? (after.budgets.invoke_cost_tokens?.value || 0) - (before.budgets.invoke_cost_tokens?.value || 0) : null,
      deferred_cost_tokens:
        budgetComparable ? (after.budgets.deferred_cost_tokens?.value || 0) - (before.budgets.deferred_cost_tokens?.value || 0) : null,
    },
    resolvedFailures,
    newFailures,
    beforeSummary: before.summary,
    afterSummary: after.summary,
  };
  payload.nextAction = createComparisonNextAction(payload);
  return payload;
}
