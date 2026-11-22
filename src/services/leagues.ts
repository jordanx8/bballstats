import { SourceType } from '../types';

/** Men's (`cbb`) and women's (`wcbb`) college basketball. */
export function isCollege(sourceType: SourceType | string): boolean {
  return sourceType === 'cbb' || sourceType === 'wcbb';
}

/**
 * How a league's game is divided: men's college plays two halves; NBA, WNBA and
 * women's college play four quarters. Periods past regulation are overtimes.
 */
export function periodFormat(sourceType: SourceType | string): { regulation: number; prefix: 'H' | 'Q' } {
  return sourceType === 'cbb' ? { regulation: 2, prefix: 'H' } : { regulation: 4, prefix: 'Q' };
}

/** Label for the period at a 0-based index, e.g. H1, Q3, OT1. */
export function periodLabel(sourceType: SourceType | string, index: number): string {
  const { regulation, prefix } = periodFormat(sourceType);
  return index >= regulation ? `OT${index - regulation + 1}` : `${prefix}${index + 1}`;
}

/** Whether a game with this many periods went to overtime. */
export function isOvertimeGame(sourceType: SourceType | string, periodCount: number): boolean {
  return periodCount > periodFormat(sourceType).regulation;
}
