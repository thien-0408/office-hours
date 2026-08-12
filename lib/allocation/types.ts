import type { AllocationPolicyName } from "@/lib/office-hours/types";

// One student's candidacy for a single freed slot, as the allocate() engine
// needs to see it — deliberately smaller than the full WAITLIST_ENTRIES row
// (capstone-db-schema.md §4.1): only the signals the four policies actually
// read.
export interface AllocationCandidate {
  waitlistEntryId: number;
  studentId: number;
  requestedAt: string; // ISO-8601 — when the student joined this slot's waitlist
  /** Days since this student last met THIS lecturer. null = never. */
  daysSinceLastMeetingThisLecturer: number | null;
  /** Days since this student last met ANY lecturer. null = never met anyone (max need). */
  daysSinceLastMeetingAnyLecturer: number | null;
  /** How many slots this student has already won inside the current ROUND_ROBIN window. */
  recentAccessCount: number;
}

// Mirrors allocation_policies.config (capstone-db-schema.md §4.2). Every
// field is optional — each policy fills in its own defaults so a bare `{}`
// (FCFS/ROUND_ROBIN's seeded config) is always valid.
export interface AllocationPolicyConfig {
  needWeight?: number;
  waitTimeWeight?: number;
  fairnessWeight?: number; // HYBRID's randomization/tie-break weight
  maxPerWindow?: number; // ROUND_ROBIN's per-student cap, default 1
}

export interface AllocationCandidateResult {
  waitlistEntryId: number;
  studentId: number;
  decision: "SELECTED" | "SKIPPED";
  computedScore: number; // always in [0, 1]
}

export interface AllocationResult {
  policyName: AllocationPolicyName;
  randomSeed: number;
  /** null when no candidate was eligible (e.g. everyone is over a ROUND_ROBIN cap, or the pool was empty) — the slot goes unfilled this run. */
  winner: AllocationCandidateResult | null;
  /** One row per input candidate — the direct analogue of the allocation_events rows a real run would write (capstone-db-schema.md §4.3). */
  candidates: AllocationCandidateResult[];
}
