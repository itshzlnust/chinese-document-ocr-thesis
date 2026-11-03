/**
 * SuperMemo-2 (SM2) Adaptive Spaced Repetition Scheduling Engine
 * ==============================================================
 * Implements the core SRS requirements of LexiDoc (Thesis Proposal Section 3.5.5 F6 & FR-SRS-05):
 *
 * Recall Rating Grades:
 * - Again (q=1): Complete blackout / incorrect recall. Interval resets to 1 day.
 * - Hard  (q=3): Correct response with serious difficulty.
 * - Good  (q=4): Correct response after hesitation.
 * - Easy  (q=5): Perfect recall without hesitation.
 *
 * Mathematical Formula:
 *   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *   Constraint: EF' >= 1.3
 *
 *   If q < 3:
 *     n = 0
 *     I(1) = 1 day
 *   Else:
 *     n = n + 1
 *     I(1) = 1 day
 *     I(2) = 6 days
 *     I(n) = round(I(n-1) * EF')
 */

export interface SM2ReviewResult {
  easinessFactor: number;
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: string; // YYYY-MM-DD
  grade: 1 | 3 | 4 | 5;
  masteryLevel: number;   // 0 to 5
}

export class SM2SchedulerService {
  /**
   * Compute next review schedule given user grade
   */
  public static calculateReview(
    card: {
      easinessFactor?: number;
      repetitionCount?: number;
      intervalDays?: number;
    },
    qualityGrade: 1 | 3 | 4 | 5
  ): SM2ReviewResult {
    const q = qualityGrade;
    const currentEF = card.easinessFactor ?? 2.5;
    const currentRep = card.repetitionCount ?? 0;
    const currentInterval = card.intervalDays ?? 1;

    // 1. Calculate new Easiness Factor (EF)
    let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEF < 1.3) newEF = 1.3;
    newEF = Number(newEF.toFixed(2));

    // 2. Calculate new repetition count and interval
    let newRep = currentRep;
    let newInterval = 1;

    if (q < 3) {
      // Failed recall -> reset streak
      newRep = 0;
      newInterval = 1;
    } else {
      // Successful recall
      if (currentRep === 0) {
        newInterval = 1;
      } else if (currentRep === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEF);
        if (q === 3) {
          // Hard penalty: slower progression
          newInterval = Math.max(currentInterval + 1, Math.round(currentInterval * 1.2));
        } else if (q === 5) {
          // Easy bonus: faster progression
          newInterval = Math.round(newInterval * 1.3);
        }
      }
      newRep = currentRep + 1;
    }

    // 3. Compute next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    const nextReviewDate = nextDate.toISOString().split('T')[0];

    // Compute visual mastery level (0 to 5)
    let masteryLevel = Math.min(5, Math.floor(newRep / 1.5) + (newEF >= 2.5 ? 1 : 0));
    if (q < 3) masteryLevel = Math.max(0, masteryLevel - 1);

    return {
      easinessFactor: newEF,
      repetitionCount: newRep,
      intervalDays: newInterval,
      nextReviewDate,
      grade: q,
      masteryLevel,
    };
  }

  /**
   * Check if a flashcard is due for review today or earlier
   */
  public static isDueToday(card: { nextReviewDate?: string }): boolean {
    if (!card.nextReviewDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return card.nextReviewDate <= today;
  }

  /**
   * Format interval in human readable string (e.g. "1 hari", "6 hari", "24 hari")
   */
  public static formatInterval(days: number): string {
    if (days <= 1) return '1 hari';
    if (days < 30) return `${days} hari`;
    const months = Math.round(days / 30);
    return `${months} bulan`;
  }
}

