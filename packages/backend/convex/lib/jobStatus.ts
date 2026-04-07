/**
 * Job status rollup helper.
 *
 * Single source of truth for `jobs.status`, the scheduled window, and the
 * job-level completedAt. Any use case that creates or updates a job's
 * segments or invoices MUST call `computeJobRollup` and write the resulting
 * `status` back to the job atomically inside the same mutation.
 *
 * `scheduledStartAt`, `scheduledCompleteAt`, and `completedAt` are NOT stored
 * on the jobs table — they are returned here so the API layer can include
 * them in job read responses.
 *
 * Canceled segments are excluded from all rollups.
 */

export type JobStatus =
  | "lead"
  | "estimated"
  | "approved"
  | "in_progress"
  | "completed"
  | "paid";

export type SegmentStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "canceled";

export type EstimateStatus =
  | "draft"
  | "finalized"
  | "sent"
  | "approved"
  | "declined";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface SegmentLike {
  status: SegmentStatus;
  scheduledAt?: number;
  completedAt?: number;
}

export interface EstimateLike {
  status: EstimateStatus;
}

export interface InvoiceLike {
  status: InvoiceStatus;
}

export interface JobRollup {
  status: JobStatus;
  scheduledStartAt: number | undefined;
  scheduledCompleteAt: number | undefined;
  completedAt: number | undefined;
}

/**
 * Compute the derived rollup fields for a job from its segments, estimates,
 * and invoices.
 *
 * Status rules:
 *  - `lead`        — no estimate exists for the job
 *  - `estimated`   — estimate(s) exist but none approved
 *  - `approved`    — an approved estimate exists and no non-canceled segment
 *                    has progressed past `scheduled`
 *  - `in_progress` — any non-canceled segment is `in_progress`, OR some but
 *                    not all non-canceled segments are `completed`
 *  - `completed`   — all non-canceled segments are `completed` AND at least
 *                    one non-canceled segment exists
 *  - `paid`        — `completed` AND every non-draft invoice is `paid`
 *
 * Edge case: a job with an approved estimate but zero non-canceled segments
 * (e.g., all segments canceled, or none created yet) stays at `approved`.
 */
export function computeJobRollup(
  segments: readonly SegmentLike[],
  estimates: readonly EstimateLike[],
  invoices: readonly InvoiceLike[],
): JobRollup {
  const liveSegments = segments.filter((s) => s.status !== "canceled");

  const scheduledTimes = liveSegments
    .map((s) => s.scheduledAt)
    .filter((t): t is number => typeof t === "number");
  const scheduledStartAt = scheduledTimes.length
    ? Math.min(...scheduledTimes)
    : undefined;
  const scheduledCompleteAt = scheduledTimes.length
    ? Math.max(...scheduledTimes)
    : undefined;

  const status = computeStatus(liveSegments, estimates, invoices);

  let completedAt: number | undefined;
  if (status === "completed" || status === "paid") {
    const completionTimes = liveSegments
      .map((s) => s.completedAt)
      .filter((t): t is number => typeof t === "number");
    completedAt = completionTimes.length
      ? Math.max(...completionTimes)
      : undefined;
  }

  return { status, scheduledStartAt, scheduledCompleteAt, completedAt };
}

function computeStatus(
  liveSegments: readonly SegmentLike[],
  estimates: readonly EstimateLike[],
  invoices: readonly InvoiceLike[],
): JobStatus {
  if (estimates.length === 0) {
    return "lead";
  }

  const hasApproved = estimates.some((e) => e.status === "approved");
  if (!hasApproved) {
    return "estimated";
  }

  if (liveSegments.length === 0) {
    return "approved";
  }

  const allCompleted = liveSegments.every((s) => s.status === "completed");
  const anyInProgress = liveSegments.some((s) => s.status === "in_progress");
  const anyCompleted = liveSegments.some((s) => s.status === "completed");

  if (allCompleted) {
    const billable = invoices.filter((i) => i.status !== "draft");
    const allPaid =
      billable.length > 0 && billable.every((i) => i.status === "paid");
    return allPaid ? "paid" : "completed";
  }

  if (anyInProgress || anyCompleted) {
    return "in_progress";
  }

  return "approved";
}
