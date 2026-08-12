import { mulberry32, seededHash } from "@/lib/prng";
import type { AllocationPolicyName } from "@/lib/office-hours/types";
import type {
  AllocationCandidate,
  AllocationCandidateResult,
  AllocationPolicyConfig,
  AllocationResult,
} from "./types";

// Formulas — see docs/capstone-officehours-plan.md §11.2 for the policy
// descriptions this implements. Every policy scores in [0,1] so results stay
// comparable across policies even though they rank candidates differently.

// Caps used to normalize raw signals before weighting — without a cap, one
// extreme outlier (e.g. a student who's genuinely never met any lecturer)
// would dominate every other candidate's scale.
const NEED_CAP_DAYS = 90; // "haven't met in 90+ days" already maxes out need
const WAIT_CAP_HOURS = 7 * 24; // a week of waiting already maxes out wait urgency

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function needComponent(c: AllocationCandidate): number {
  const days = c.daysSinceLastMeetingThisLecturer ?? c.daysSinceLastMeetingAnyLecturer ?? NEED_CAP_DAYS;
  return clamp01(days / NEED_CAP_DAYS);
}

function waitComponent(c: AllocationCandidate, nowMs: number): number {
  const waitHours = (nowMs - new Date(c.requestedAt).getTime()) / (1000 * 60 * 60);
  return clamp01(waitHours / WAIT_CAP_HOURS);
}

interface PolicyOutcome {
  scores: Map<number, number>; // waitlistEntryId -> [0,1] score, for every candidate (including ineligible ones, for display)
  eligible: Set<number>; // waitlistEntryId set that may actually win — only ROUND_ROBIN excludes anyone
}

// FCFS — strict join-order. The ranking IS the mechanism; score is derived
// from it only so FCFS reports a comparable [0,1] number alongside the other
// policies: 1.0 for the earliest joiner, 0.0 for the latest, linear between.
// Ties (identical requestedAt) break on waitlistEntryId ascending.
function scoreFcfs(candidates: AllocationCandidate[]): PolicyOutcome {
  const ranked = [...candidates].sort(
    (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime() || a.waitlistEntryId - b.waitlistEntryId
  );
  const scores = new Map<number, number>();
  ranked.forEach((c, i) => {
    scores.set(c.waitlistEntryId, ranked.length <= 1 ? 1 : 1 - i / (ranked.length - 1));
  });
  return { scores, eligible: new Set(candidates.map((c) => c.waitlistEntryId)) };
}

// NEED (priority-by-need) — score = needWeight*need + waitWeight*wait,
// weights normalized to sum to 1. Default config (needWeight: 1, matching
// the seeded policy row in mock-data.ts) is pure need-ranking unless an
// admin tunes in a waitTimeWeight via PATCH /allocation-policies/{id}.
function scoreNeed(candidates: AllocationCandidate[], config: AllocationPolicyConfig, nowMs: number): PolicyOutcome {
  const needWeight = config.needWeight ?? 1;
  const waitWeight = config.waitTimeWeight ?? 0;
  const total = Math.max(needWeight + waitWeight, 1e-9);
  const scores = new Map<number, number>();
  for (const c of candidates) {
    const raw = needWeight * needComponent(c) + waitWeight * waitComponent(c, nowMs);
    scores.set(c.waitlistEntryId, clamp01(raw / total));
  }
  return { scores, eligible: new Set(candidates.map((c) => c.waitlistEntryId)) };
}

// ROUND_ROBIN — an eligibility gate, not a ranking. Candidates who've
// already won >= maxPerWindow slots this window (default 1) are ineligible
// outright, regardless of how long they've waited or how much they need it
// — that's the whole point (cap access, don't re-rank need; NEED/HYBRID
// already do that job). Among eligible candidates, falls back to FCFS
// ordering. Ineligible candidates still get a display score (their FCFS
// score, so the UI can show "would've ranked here, but capped") but can
// never win — see the eligible set, not just the score, in allocate() below.
function scoreRoundRobin(candidates: AllocationCandidate[], config: AllocationPolicyConfig): PolicyOutcome {
  const cap = config.maxPerWindow ?? 1;
  const { scores } = scoreFcfs(candidates);
  const eligible = new Set(candidates.filter((c) => c.recentAccessCount < cap).map((c) => c.waitlistEntryId));
  return { scores, eligible };
}

// HYBRID — score = needWeight*need + waitTimeWeight*wait + fairnessWeight*
// random, weights normalized to sum to 1. `random` is a deterministic
// per-candidate draw seeded from (runSeed, waitlistEntryId) — reproducible
// (same seed -> same winner) but not predictable to a student trying to
// game the ranking, which is the anti-gaming role plan.md §11.2 describes
// for this term.
function scoreHybrid(
  candidates: AllocationCandidate[],
  config: AllocationPolicyConfig,
  seed: number,
  nowMs: number
): PolicyOutcome {
  const needWeight = config.needWeight ?? 0.5;
  const waitTimeWeight = config.waitTimeWeight ?? 0.3;
  const fairnessWeight = config.fairnessWeight ?? 0.2;
  const total = Math.max(needWeight + waitTimeWeight + fairnessWeight, 1e-9);
  const scores = new Map<number, number>();
  for (const c of candidates) {
    const rand = mulberry32(seededHash(seed, c.waitlistEntryId))();
    const raw = needWeight * needComponent(c) + waitTimeWeight * waitComponent(c, nowMs) + fairnessWeight * rand;
    scores.set(c.waitlistEntryId, clamp01(raw / total));
  }
  return { scores, eligible: new Set(candidates.map((c) => c.waitlistEntryId)) };
}

/**
 * allocate(slot, candidates, config) -> winner + score, per
 * docs/capstone-officehours-plan.md §11.2's interface. Deterministic given
 * (candidates, policyName, config, seed, now) — replaying the same inputs
 * always reproduces the same winner (NFR-3).
 */
export function allocate(
  candidates: AllocationCandidate[],
  policyName: AllocationPolicyName,
  config: AllocationPolicyConfig,
  seed: number,
  now: Date = new Date()
): AllocationResult {
  const nowMs = now.getTime();

  const outcome: PolicyOutcome =
    policyName === "FCFS"
      ? scoreFcfs(candidates)
      : policyName === "NEED"
        ? scoreNeed(candidates, config, nowMs)
        : policyName === "ROUND_ROBIN"
          ? scoreRoundRobin(candidates, config)
          : scoreHybrid(candidates, config, seed, nowMs);

  let winnerId: number | null = null;
  let winnerScore = -Infinity;
  for (const c of candidates) {
    if (!outcome.eligible.has(c.waitlistEntryId)) continue;
    const score = outcome.scores.get(c.waitlistEntryId) ?? 0;
    if (score > winnerScore || (score === winnerScore && winnerId !== null && c.waitlistEntryId < winnerId)) {
      winnerScore = score;
      winnerId = c.waitlistEntryId;
    }
  }

  const results: AllocationCandidateResult[] = candidates.map((c) => ({
    waitlistEntryId: c.waitlistEntryId,
    studentId: c.studentId,
    computedScore: Math.round((outcome.scores.get(c.waitlistEntryId) ?? 0) * 10000) / 10000,
    decision: c.waitlistEntryId === winnerId ? "SELECTED" : "SKIPPED",
  }));

  return {
    policyName,
    randomSeed: seed,
    winner: results.find((r) => r.decision === "SELECTED") ?? null,
    candidates: results,
  };
}
