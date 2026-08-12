# The `allocate()` Engine — Design, Formulas, and Validation

This document is the detailed reference for the slot-allocation engine implemented in
`lib/allocation/engine.ts`, written to be citable directly in the capstone report/thesis
chapter for §11 ("Research Design — Fairness in Slot Allocation") of
`capstone-officehours-plan.md`. It covers what the engine does, the exact formula behind each
policy, why those formulas were chosen, how reproducibility is guaranteed, how the four
policies feed the fairness/efficiency metrics, and the validation performed against known test
cases.

---

## 1. Problem statement

When an office-hours slot frees up (a booking is cancelled, or a waitlist offer is created) and
more than one student is waiting for it, **who gets it?** `allocate()` answers that question. It
implements the interface `capstone-officehours-plan.md` §11.2 specifies:

```
allocate(slot, candidates, config) → winner + score
```

Four interchangeable policies implement this interface — `FCFS`, `NEED`, `ROUND_ROBIN`,
`HYBRID` — switchable per `ALLOCATION_POLICIES.is_active` (`capstone-db-schema.md` §4.2). The
engine is the empirical vehicle for the capstone's core research question:

> When office-hour slots are scarcer than demand, which allocation policy best balances
> fairness and efficiency, and what are the trade-offs?

---

## 2. Interface and types

```ts
allocate(
  candidates: AllocationCandidate[],
  policyName: AllocationPolicyName,   // "FCFS" | "NEED" | "ROUND_ROBIN" | "HYBRID"
  config: AllocationPolicyConfig,
  seed: number,
  now: Date = new Date()
): AllocationResult
```

**Input** — `AllocationCandidate` (`lib/allocation/types.ts`), one per waitlisted student
contending for the freed slot:

| Field | Meaning |
|---|---|
| `waitlistEntryId` | Identity of this candidacy (maps to `waitlist_entries.id`) |
| `studentId` | Who's contending |
| `requestedAt` | ISO-8601 timestamp the student joined this slot's waitlist |
| `daysSinceLastMeetingThisLecturer` | `null` if never met this lecturer |
| `daysSinceLastMeetingAnyLecturer` | `null` if never met any lecturer (fallback signal) |
| `recentAccessCount` | Slots already won inside the current `ROUND_ROBIN` window |

**Config** — `AllocationPolicyConfig`, mirrors `allocation_policies.config` jsonb
(`capstone-db-schema.md` §4.2):

| Field | Used by | Default if omitted |
|---|---|---|
| `needWeight` | `NEED`, `HYBRID` | `1` for NEED, `0.5` for HYBRID |
| `waitTimeWeight` | `NEED`, `HYBRID` | `0` for NEED, `0.3` for HYBRID |
| `fairnessWeight` | `HYBRID` only (the anti-gaming random term) | `0.2` |
| `maxPerWindow` | `ROUND_ROBIN` only (the per-student cap) | `1` |

**Output** — `AllocationResult`:

```ts
{
  policyName, randomSeed,
  winner: { waitlistEntryId, studentId, decision: "SELECTED", computedScore } | null,
  candidates: AllocationCandidateResult[]  // one row per input candidate — SELECTED or SKIPPED
}
```

`winner` is `null` when no candidate is eligible to win (empty pool, or — `ROUND_ROBIN` only —
every candidate is already over the per-student cap). This maps directly onto
`allocation_events` rows: every candidate produces a `SELECTED`/`SKIPPED` row, per the
"reproducibility backbone" design note in `capstone-db-schema.md` §4.3.

---

## 3. Normalization — the two shared signals

Three of the four policies score candidates using one or both of two signals, both normalized
into `[0, 1]` before any weighting so the policies stay comparable on the same scale:

**need(c)** — how underserved this student is:

```
need(c) = clamp01( days(c) / NEED_CAP_DAYS )

days(c) = daysSinceLastMeetingThisLecturer(c)
          ?? daysSinceLastMeetingAnyLecturer(c)
          ?? NEED_CAP_DAYS         // never met anyone -> maximum need

NEED_CAP_DAYS = 90
```

**wait(c)** — how long this student has already waited for *this* slot:

```
wait(c) = clamp01( hoursWaiting(c) / WAIT_CAP_HOURS )

hoursWaiting(c) = (now - requestedAt(c)) in hours
WAIT_CAP_HOURS = 7 * 24 = 168   // one week
```

**Why cap instead of leaving the raw value unbounded?** Without a cap, one extreme outlier (a
student who genuinely never met any lecturer, or has waited a month) would dominate every other
candidate's score regardless of the configured weights — a single `days = 400` would drown out
everyone else's differences. Capping at "past this point, you're already maximally
underserved/maximally waited" keeps the *relative* ordering meaningful for the realistic range
and prevents one pathological input from making every other signal irrelevant.

`clamp01(x) = max(0, min(1, x))` — defensive floor/ceiling, guards against a negative timestamp
delta (clock skew) or a `days` value exceeding the cap.

---

## 4. The four policies

### 4.1 FCFS — First-Come-First-Served

```
rank(c) = position of c when all candidates are sorted by requestedAt ascending
          (ties broken by waitlistEntryId ascending — deterministic, no randomness needed)

score(c) = 1 − rank(c) / (n − 1)          for n > 1
score(c) = 1                               for n = 1
```

**Mechanism:** the winner is whoever has the smallest `requestedAt` — pure arrival order. The
formula above isn't the selection mechanism itself (selection is a direct sort), it exists only
so FCFS reports a `[0,1]` score comparable to the other three policies in analytics/exports:
the earliest joiner scores `1.0`, the latest scores `0.0`, linearly in between.

**Rationale:** the literature baseline for any allocation-fairness study — simple, well
understood, and the natural "no policy" control condition. Per `plan.md` §11.2: *"Simple, but
rewards speed/luck, not need."*

**Worked example** — 3 candidates joined 2h, 5h, and 1h ago:

| candidate | wait | rank | score |
|---|---|---|---|
| A | 2h ago | 2nd | 0.5 |
| B | 5h ago | 1st (earliest) | **1.0 → winner** |
| C | 1h ago | 3rd | 0.0 |

### 4.2 NEED — Priority by need

```
score(c) = ( needWeight · need(c) + waitWeight · wait(c) ) / (needWeight + waitWeight)
```

Weights normalize to sum to 1 so the score stays in `[0,1]` regardless of how they're tuned.
**Default config** (`needWeight: 1`, matching the seeded policy row in
`lib/office-hours/mock-data.ts`) is **pure need-ranking** — `waitWeight` defaults to `0` unless
an admin tunes one in via `PATCH /allocation-policies/{id}`. This is a deliberate reading of
`plan.md`'s description (*"score by how long since the student last met this lecturer (or any
lecturer), plus wait time"*) as a *configurable* blend, not a fixed formula — the seeded default
happens to weight wait time at zero, but the mechanism supports blending it in.

**Rationale:** the "fairness-forward" policy — students who've gone longest without advisor
access get priority, regardless of when they joined *this particular* queue. Directly targets
the "% of students who got ≥1 slot" and Gini metrics in `plan.md` §11.3.

**Worked example** — needWeight=1, waitWeight=0 (seeded default):

| candidate | days since last met | need | score |
|---|---|---|---|
| A | 5 days | 0.056 | 0.056 |
| B | 80 days | 0.889 | **0.889 → winner** |
| C | 20 days | 0.222 | 0.222 |

### 4.3 ROUND_ROBIN

```
eligible(c) = recentAccessCount(c) < maxPerWindow      (default maxPerWindow = 1)

winner = argmax over { c : eligible(c) } of FCFS-score(c)
```

**This is an eligibility gate, not a ranking.** A candidate who has already won
`maxPerWindow` slots in the current window is excluded from winning outright — the mechanism
never even compares their need or wait time, because the whole point of round-robin is capping
*access*, not re-ranking *need* (that's `NEED`/`HYBRID`'s job). Among the remaining eligible
candidates, selection falls back to FCFS ordering (earliest join wins). Ineligible candidates
still receive a display score (their FCFS score, for transparency in the UI — "you would've
ranked here, but you're capped this window") but the `eligible` set, not the score, is what the
engine checks before picking a winner.

**Edge case:** if *every* candidate is over the cap, `winner` is `null` — the slot goes unfilled
this run rather than the engine picking an ineligible "least-bad" candidate. This was
specifically validated (§6 below).

**Rationale:** prevents monopolization of popular lecturers by students who repeatedly win —
per `plan.md` §11.2: *"cap per-student access per window so no one monopolizes popular
lecturers."*

### 4.4 HYBRID

```
score(c) = ( needWeight · need(c) + waitTimeWeight · wait(c) + fairnessWeight · rand(c) )
           / (needWeight + waitTimeWeight + fairnessWeight)

rand(c) = mulberry32( seededHash(seed, waitlistEntryId(c)) )()     // deterministic, in [0,1)
```

**Default config** (matching the seeded HYBRID policy row): `needWeight: 0.5, waitTimeWeight:
0.3, fairnessWeight: 0.2`.

**The random term is deliberate, not noise-for-noise's-sake.** Without it, ties resolve
deterministically (e.g. always by `waitlistEntryId`), which a motivated student could learn and
exploit (e.g. "always request right after midnight to get a low ID"). A small weighted random
draw makes the ranking *unpredictable* to an outside observer trying to game it, while staying
*reproducible* to the system itself — replaying the same seed against the same candidates always
produces the same winner (see §5). This is exactly the tie-breaking/anti-gaming role `plan.md`
§11.2 assigns to HYBRID's randomization term.

**Rationale:** the capstone's actual novel contribution — a tunable blend of fairness (need),
responsiveness (wait time), and anti-gaming (randomization), intended to Pareto-dominate the
other three on the fairness-vs-efficiency frontier (`plan.md` §11.4's defense centerpiece plot).

---

## 5. Reproducibility (NFR-3)

Every allocation run takes one `seed`. `capstone-db-schema.md` requires *"decisions are
deterministic given inputs + policy + seed"* (NFR-3) — replaying the same run must reproduce
the same winner, which is what makes the fairness study's experiments *comparable* across
policies (§11.4: *"replay the same demand stream through each policy"*) and *citable* (a
reviewer can re-run your exact seed and get your exact numbers).

The engine achieves this with two pieces in `lib/prng.ts`:

- **`mulberry32(seed)`** — a small, fast, pure PRNG. "Pure" matters specifically: it never
  calls `Math.random()`, so it's safe to call during React render (avoids tripping the React
  Compiler's `react-hooks/purity` rule) and its output depends *only* on its seed argument, not
  on call order or external state.
- **`seededHash(seed, salt)`** — derives an independent sub-seed from a base seed plus a salt
  (here, a `waitlistEntryId`) via a cheap string hash. This is what lets **every candidate draw
  its own reproducible random value without depending on a shared PRNG's sequence position** —
  i.e., HYBRID's random draw for candidate #7 doesn't depend on how many other candidates were
  scored before it in the loop. Without this, reordering the candidate array (which shouldn't
  matter) could silently change who wins.

---

## 6. Validation performed

The engine's core selection logic was validated with a standalone script (11 checks, all
passing) covering:

- FCFS picks the earliest joiner.
- NEED picks the highest-need candidate under the default (pure-need) config.
- ROUND_ROBIN excludes an over-cap candidate even when they're the earliest joiner, and returns
  `winner: null` when *every* candidate is over cap (no silent fallback to picking someone
  ineligible).
- HYBRID: identical `(candidates, config, seed)` always produces the identical winner and
  `computedScore` — confirms reproducibility isn't accidental.
- All four policies keep every `computedScore` within `[0,1]` even under deliberately extreme
  inputs (200-hour waits, 500-day need gaps).
- An empty candidate pool returns `winner: null` and an empty `candidates` array, not a crash.

Separately, the **Gini coefficient** implementation that consumes this engine's output
(`giniCoefficient()` in `lib/office-hours/mock-data.ts`) was validated against five families of
known test cases plus an independent cross-check:

| Test | Expected | Result |
|---|---|---|
| Perfect equality (any population size, all equal) | `G = 0` | exact |
| Winner-take-all (`n` candidates, one gets everything) | closed form `G = (n−1)/n` | exact to 6 decimal places, `n` ∈ {2,4,10,100} |
| Classic textbook case `[10,20,30,40]` | `G = 0.25` (hand-verified two ways) | exact |
| Arithmetic progression `1..n` | closed form `G = (n−1)/(3n)` | exact to 6 decimal places, `n` ∈ {5,10,50,200} |
| Empty / all-zero input | `G = 0` (no divide-by-zero) | exact |
| **Cross-check**: the shipped rank-based formula vs. an independently implemented mean-absolute-difference formula (a structurally different derivation of the same statistic) | must agree | **0 mismatches across 500 random trials** |
| Bounds | `G ∈ [0, 1)` for any non-negative input | **0 violations across 500 random trials** |

The cross-check is the strongest evidence: two different formulas for the same statistic
agreeing across 500 random inputs to floating-point precision rules out a coincidental match on
hand-picked cases alone — this is the kind of validation worth citing directly in a methods
section.

---

## 7. From one allocation to a policy comparison — the simulation layer

`allocate()` decides **one slot's** winner. The research question is about **policy-level**
behavior over time, so `simulatePolicy()` (`lib/office-hours/mock-data.ts`) replays a bounded,
seeded synthetic population through the engine across many simulated slot free-up events, then
computes the fairness/efficiency metrics from what actually happened:

- **Population model**: `SIM_STUDENTS = 60` students, `SIM_LECTURERS = 12` lecturers,
  `SIM_EVENTS = 240` simulated slot free-ups. Each student has a fixed "popularity affinity"
  drawn as `rand() ^ (1 / popularitySkew)` — higher `popularitySkew` (a `SyntheticDemandRun`
  parameter, `plan.md` §11.4's "configurable popularity skew") concentrates affinities closer to
  1, meaning demand clusters on fewer popular slots (more realistic contention).
- **Per-event candidate pool**: each student joins a given event's waitlist with probability
  proportional to their affinity; low-affinity draws can produce an empty pool (the slot goes
  unfilled that event — this is what keeps `slotUtilizationPct` meaningfully below 100% rather
  than trivially always full).
- **State carried across events**: `daysSinceLastMeetingThisLecturer`/`AnyLecturer` reset to 0
  for the winner and increment for everyone else after each event — so `NEED`'s signal is driven
  by genuine simulated history, not a static seed value. `recentAccessCount` (for
  `ROUND_ROBIN`) resets every 20 events so the cap doesn't permanently lock anyone out across
  the full 240-event run.
- **Modeled offer decline**: after a winner is selected, a seeded 12% chance (`SIM_DECLINE_CHANCE`)
  represents the winner declining/expiring the offer — this is what
  `offerRejectionRatePct` actually measures (declined ÷ offered), not a proxy for the
  skipped-candidate ratio.

**Metrics derived from the simulation** (all computed from real simulated outcomes, not
hand-picked):

| Metric | Formula |
|---|---|
| `giniSlotsPerStudent` | Gini coefficient of `slotsWon[]` across all `SIM_STUDENTS` |
| `giniLecturerAccess` | Gini coefficient of distinct-lecturer-count per student |
| `maxMinRatio` | `max(slotsWon) / min(slotsWon)` among students who won ≥1 slot; `1` if nobody won anything (no `NaN`/`Infinity`) |
| `pctStudentsWithSlot` | `(students who won ≥1 slot) / SIM_STUDENTS × 100` — `plan.md` §11.3's 4th fairness metric |
| `slotUtilizationPct` | `filledEvents / SIM_EVENTS × 100` |
| `avgWaitTimeSeconds` | mean of winners' simulated wait time |
| `waitTimeVariance` | **population** variance (÷n, not ÷(n−1) — appropriate since this describes the full simulated population, not a sample from a larger one) of winners' wait times, converted to seconds² |
| `offerRejectionRatePct` | `declinedCount / offeredCount × 100` |
| `avgTimeToFillSeconds` | derived from `avgWaitTimeSeconds` (a fixed proportionality, not independently modeled) |

**Scope honesty**: this is a genuine agent-based micro-simulation of real policy behavior —
not a lookup table — but it is intentionally bounded (fixed population/event counts regardless
of the configured `SyntheticDemandRun.numStudents`/`numLecturers`) so it computes client-side in
well under a frame, even for the largest seeded demand run (10,000 students / 800 lecturers).
This trades population-scale realism for tractability, appropriate for a frontend research
console. It is **not** the full server-side generator `plan.md` §11.4 describes for the real
pilot study — that remains a backend implementation task (see the roadmap in the DASHBOARD-UPGRADE.md
allocation-engine note).

Both `computeExperimentResults()` (Research Tools, admin-chosen demand run + seed) and
`getMockPolicyComparison()` (Analytics' fixed dashboard summary, seed `1337`) call
`simulatePolicy()` — so a "fairer" policy in either view means the real scoring formulas above
actually produced a more equal distribution in that simulation run, not that a constant was
typed to look good.

---

## 8. File map

| File | Contents |
|---|---|
| `lib/allocation/engine.ts` | `allocate()` and the four scoring functions — the algorithm itself |
| `lib/allocation/types.ts` | `AllocationCandidate`, `AllocationPolicyConfig`, `AllocationResult`, etc. |
| `lib/prng.ts` | `mulberry32()`, `seededHash()` — the shared deterministic randomness primitives |
| `lib/office-hours/mock-data.ts` | `simulatePolicy()`, `computeExperimentResults()`, `getMockPolicyComparison()`, `giniCoefficient()` — the simulation/metrics layer built on top of the engine |
| `app/(dashboard)/dashboard/admin/research/page.tsx` | Research Tools UI — demand-run config, experiment runner, results table, fairness-vs-efficiency frontier chart |
| `app/(dashboard)/dashboard/admin/analytics/page.tsx` | Analytics' Policy Comparison small multiples, reading `getMockPolicyComparison()` |

Cross-references: `docs/capstone-officehours-plan.md` §11 (research design), `docs/capstone-db-schema.md`
§4.2–4.4 (`allocation_policies`, `allocation_events`, `experiments`), `docs/capstone-api-endpoints.md`
§7/§7.1 (allocation + research endpoints), `docs/DASHBOARD-UPGRADE.md` (the "real `allocate()`
engine" implementation note under Phase 13).
