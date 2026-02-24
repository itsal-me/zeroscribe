/**
 * Confidence scoring engine for Gmail-detected subscriptions.
 *
 * Signal weights (max positive raw sum = 120):
 *   SENDER_MATCH            35 pts  — sender found in SUBSCRIPTION_PATTERNS
 *   SUBJECT_BILLING_KW      20 pts  — billing keyword in the subject line
 *   RECURRING_EXPLICIT      15 pts  — auto-renewal / recurring language present
 *   AMOUNT_DETECTED         15 pts  — a non-zero charge amount was extracted
 *   BODY_BILLING_KW          8 pts  — billing keyword found in body only
 *   BILLING_CYCLE_EXPLICIT   5 pts  — explicit billing cycle term detected
 *   NEXT_DATE_EXTRACTED      4 pts  — an actual renewal date was parsed
 *   TRIAL_SIGNAL             3 pts  — trial-ending / trial-converting language
 *   ONE_TIME_PENALTY        -30 pts — one-time purchase keywords (no recurring override)
 *   HISTORICAL_RECURRENCE   15 pts  — same service seen previously in user's scan history
 *
 * Normalization: clipped_raw / MAX_RAW * 100, soft-capped at 90.
 * Cap relaxed to 95 only when SENDER_MATCH + RECURRING_EXPLICIT + HISTORICAL_RECURRENCE all fire.
 * Never returns 100%.
 *
 * Suggestion thresholds:
 *   >= 90 → 'auto'   (insert as active immediately)
 *   60–89 → 'ask'    (insert as pending_review, surface for user review in UI)
 *   < 60  → 'ignore' (discard silently)
 */

export type SignalCategory =
  | 'SENDER_MATCH'
  | 'SUBJECT_BILLING_KW'
  | 'BODY_BILLING_KW'
  | 'RECURRING_EXPLICIT'
  | 'AMOUNT_DETECTED'
  | 'BILLING_CYCLE_EXPLICIT'
  | 'NEXT_DATE_EXTRACTED'
  | 'TRIAL_SIGNAL'
  | 'ONE_TIME_PENALTY'
  | 'HISTORICAL_RECURRENCE'

export interface ConfidenceSignal {
  category: SignalCategory
  label: string
  points: number
}

const WEIGHTS: Record<SignalCategory, number> = {
  SENDER_MATCH:           35,
  SUBJECT_BILLING_KW:     20,
  RECURRING_EXPLICIT:     15,
  AMOUNT_DETECTED:        15,
  BODY_BILLING_KW:         8,
  BILLING_CYCLE_EXPLICIT:  5,
  NEXT_DATE_EXTRACTED:     4,
  TRIAL_SIGNAL:            3,
  ONE_TIME_PENALTY:       -30,
  HISTORICAL_RECURRENCE:  15,
}

// Sum of all positive weights — used for normalization
const MAX_RAW =
  WEIGHTS.SENDER_MATCH +
  WEIGHTS.SUBJECT_BILLING_KW +
  WEIGHTS.RECURRING_EXPLICIT +
  WEIGHTS.AMOUNT_DETECTED +
  WEIGHTS.BODY_BILLING_KW +
  WEIGHTS.BILLING_CYCLE_EXPLICIT +
  WEIGHTS.NEXT_DATE_EXTRACTED +
  WEIGHTS.TRIAL_SIGNAL +
  WEIGHTS.HISTORICAL_RECURRENCE // 120

export type ConfidenceSuggestion = 'auto' | 'ask' | 'ignore'

export interface ConfidenceResult {
  /** 0–95 integer percentage. Never 100. */
  score: number
  /** Pipe-delimited positive signal labels, suitable for DB storage */
  reason: string
  /** Positive signal labels as array, for UI display */
  reasons: string[]
  /** Full signal breakdown including penalties, for debugging */
  signals: ConfidenceSignal[]
  /** What the scan should do with this detection */
  suggestion: ConfidenceSuggestion
}

export interface ConfidenceInput {
  senderMatched: boolean
  billingKwInSubject: boolean
  billingKwInBody: boolean
  recurringSignal: boolean
  amountDetected: boolean
  billingCycleDetected: boolean
  nextDateExtracted: boolean
  trialSignal: boolean
  oneTimeSignal: boolean
  hasPreviousHistory: boolean
}

export function computeConfidenceScore(params: ConfidenceInput): ConfidenceResult {
  const fired: ConfidenceSignal[] = []

  function add(category: SignalCategory, label: string) {
    fired.push({ category, label, points: WEIGHTS[category] })
  }

  // ── Positive signals ─────────────────────────────────────────────────────
  if (params.senderMatched)
    add('SENDER_MATCH', 'Known subscription service sender')

  // Subject-line keyword outweighs body-only
  if (params.billingKwInSubject)
    add('SUBJECT_BILLING_KW', 'Billing keyword in subject line')
  else if (params.billingKwInBody)
    add('BODY_BILLING_KW', 'Billing keyword in email body')

  if (params.recurringSignal)
    add('RECURRING_EXPLICIT', 'Explicit recurring / auto-renewal language')

  if (params.amountDetected)
    add('AMOUNT_DETECTED', 'Charge amount extracted')

  if (params.billingCycleDetected)
    add('BILLING_CYCLE_EXPLICIT', 'Billing cycle explicitly stated')

  if (params.nextDateExtracted)
    add('NEXT_DATE_EXTRACTED', 'Renewal date extracted from email')

  if (params.trialSignal)
    add('TRIAL_SIGNAL', 'Trial ending or converting to paid plan')

  if (params.hasPreviousHistory)
    add('HISTORICAL_RECURRENCE', 'Previously detected from this service')

  // ── Penalty signal ────────────────────────────────────────────────────────
  // Only penalize when one-time language is present WITHOUT any recurring override
  if (params.oneTimeSignal && !params.recurringSignal)
    add('ONE_TIME_PENALTY', 'One-time purchase language (penalty)')

  // ── Score computation ─────────────────────────────────────────────────────
  const rawSum = fired.reduce((acc, s) => acc + s.points, 0)
  const clipped = Math.max(0, rawSum)

  // Allow reaching 95 only when the three strongest independent signals all fire together
  const canHitMax =
    params.senderMatched && params.recurringSignal && params.hasPreviousHistory
  const cap = canHitMax ? 95 : 90

  const score = Math.min(cap, Math.round((clipped / MAX_RAW) * 100))

  const positiveReasons = fired
    .filter((s) => s.points > 0)
    .map((s) => s.label)

  const suggestion: ConfidenceSuggestion =
    score >= 90 ? 'auto' : score >= 60 ? 'ask' : 'ignore'

  return {
    score,
    reason: positiveReasons.join(' | '),
    reasons: positiveReasons,
    signals: fired,
    suggestion,
  }
}
