import { describe, it, expect } from 'vitest';

function formatDelay(days: number, hours: number): string {
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  return parts.length > 0 ? parts.join(' ') : 'Immediatement';
}

interface StepDraft {
  delay_days: number;
  delay_hours: number;
}

function getCumulativeDelay(steps: StepDraft[], index: number): string {
  let totalDays = 0;
  let totalHours = 0;
  for (let i = 0; i <= index; i++) {
    totalDays += steps[i].delay_days;
    totalHours += steps[i].delay_hours;
  }
  totalDays += Math.floor(totalHours / 24);
  totalHours = totalHours % 24;
  const parts: string[] = [];
  if (totalDays > 0) parts.push(`${totalDays} jour${totalDays > 1 ? 's' : ''}`);
  if (totalHours > 0) parts.push(`${totalHours}h`);
  return parts.length > 0 ? parts.join(' ') : 'Immediatement';
}

describe('formatDelay', () => {
  it('returns "Immediatement" when both days and hours are 0', () => {
    expect(formatDelay(0, 0)).toBe('Immediatement');
  });

  it('shows days only when hours is 0', () => {
    expect(formatDelay(3, 0)).toBe('3j');
  });

  it('shows hours only when days is 0', () => {
    expect(formatDelay(0, 5)).toBe('5h');
  });

  it('shows both days and hours', () => {
    expect(formatDelay(2, 12)).toBe('2j 12h');
  });

  it('handles single day', () => {
    expect(formatDelay(1, 0)).toBe('1j');
  });

  it('handles single hour', () => {
    expect(formatDelay(0, 1)).toBe('1h');
  });

  it('handles large values', () => {
    expect(formatDelay(30, 23)).toBe('30j 23h');
  });
});

describe('getCumulativeDelay', () => {
  it('returns "Immediatement" for first step with zero delay', () => {
    const steps: StepDraft[] = [{ delay_days: 0, delay_hours: 0 }];
    expect(getCumulativeDelay(steps, 0)).toBe('Immediatement');
  });

  it('accumulates delays across steps', () => {
    const steps: StepDraft[] = [
      { delay_days: 0, delay_hours: 1 },
      { delay_days: 3, delay_hours: 0 },
      { delay_days: 7, delay_hours: 0 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('1h');
    expect(getCumulativeDelay(steps, 1)).toBe('3 jours 1h');
    expect(getCumulativeDelay(steps, 2)).toBe('10 jours 1h');
  });

  it('converts excess hours to days', () => {
    const steps: StepDraft[] = [
      { delay_days: 0, delay_hours: 25 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('1 jour 1h');
  });

  it('converts many hours across steps', () => {
    const steps: StepDraft[] = [
      { delay_days: 0, delay_hours: 12 },
      { delay_days: 0, delay_hours: 12 },
    ];
    expect(getCumulativeDelay(steps, 1)).toBe('1 jour');
  });

  it('handles exactly 24 hours as 1 day', () => {
    const steps: StepDraft[] = [
      { delay_days: 0, delay_hours: 24 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('1 jour');
  });

  it('uses singular "jour" for 1 day', () => {
    const steps: StepDraft[] = [
      { delay_days: 1, delay_hours: 0 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('1 jour');
  });

  it('uses plural "jours" for multiple days', () => {
    const steps: StepDraft[] = [
      { delay_days: 5, delay_hours: 0 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('5 jours');
  });

  it('only considers steps up to the given index', () => {
    const steps: StepDraft[] = [
      { delay_days: 1, delay_hours: 0 },
      { delay_days: 2, delay_hours: 0 },
      { delay_days: 3, delay_hours: 0 },
    ];
    expect(getCumulativeDelay(steps, 0)).toBe('1 jour');
    expect(getCumulativeDelay(steps, 1)).toBe('3 jours');
  });
});

describe('Email Sequence Step Validation Logic', () => {
  interface StepValidation {
    channel: 'email' | 'whatsapp';
    subject: string;
    body: string;
  }

  function validateSteps(steps: StepValidation[]): { valid: boolean; error: string | null } {
    const invalidEmails = steps.filter(s => s.channel === 'email' && (!s.subject || !s.body));
    if (invalidEmails.length > 0) {
      return { valid: false, error: 'Tous les emails doivent avoir un objet et un message' };
    }
    const invalidWhatsapp = steps.filter(s => s.channel === 'whatsapp' && !s.body);
    if (invalidWhatsapp.length > 0) {
      return { valid: false, error: 'Tous les messages WhatsApp doivent avoir un contenu' };
    }
    return { valid: true, error: null };
  }

  it('passes for valid email step', () => {
    const result = validateSteps([{ channel: 'email', subject: 'Hello', body: 'World' }]);
    expect(result.valid).toBe(true);
  });

  it('fails for email step without subject', () => {
    const result = validateSteps([{ channel: 'email', subject: '', body: 'Body' }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('objet');
  });

  it('fails for email step without body', () => {
    const result = validateSteps([{ channel: 'email', subject: 'Subject', body: '' }]);
    expect(result.valid).toBe(false);
  });

  it('passes for valid whatsapp step (no subject required)', () => {
    const result = validateSteps([{ channel: 'whatsapp', subject: '', body: 'Hello via WA' }]);
    expect(result.valid).toBe(true);
  });

  it('fails for whatsapp step without body', () => {
    const result = validateSteps([{ channel: 'whatsapp', subject: '', body: '' }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('WhatsApp');
  });

  it('validates mixed steps correctly', () => {
    const result = validateSteps([
      { channel: 'email', subject: 'Hello', body: 'World' },
      { channel: 'whatsapp', subject: '', body: 'WA message' },
    ]);
    expect(result.valid).toBe(true);
  });

  it('catches first invalid email in mixed steps', () => {
    const result = validateSteps([
      { channel: 'email', subject: 'Valid', body: 'Valid' },
      { channel: 'email', subject: '', body: 'Missing subject' },
      { channel: 'whatsapp', subject: '', body: 'WA' },
    ]);
    expect(result.valid).toBe(false);
  });
});

describe('Step Ordering and Management', () => {
  interface Step {
    step_order: number;
    delay_days: number;
    delay_hours: number;
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp';
  }

  function removeStep(steps: Step[], index: number): Step[] {
    if (steps.length <= 1) return steps;
    return steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 }));
  }

  it('cannot remove the last remaining step', () => {
    const steps: Step[] = [{
      step_order: 1, delay_days: 0, delay_hours: 1, subject: 'Only', body: 'Step', channel: 'email',
    }];
    const result = removeStep(steps, 0);
    expect(result).toHaveLength(1);
  });

  it('removes a step and re-orders remaining steps', () => {
    const steps: Step[] = [
      { step_order: 1, delay_days: 0, delay_hours: 1, subject: 'A', body: 'A', channel: 'email' },
      { step_order: 2, delay_days: 3, delay_hours: 0, subject: 'B', body: 'B', channel: 'email' },
      { step_order: 3, delay_days: 7, delay_hours: 0, subject: 'C', body: 'C', channel: 'whatsapp' },
    ];
    const result = removeStep(steps, 1);
    expect(result).toHaveLength(2);
    expect(result[0].subject).toBe('A');
    expect(result[0].step_order).toBe(1);
    expect(result[1].subject).toBe('C');
    expect(result[1].step_order).toBe(2);
  });

  it('removes first step correctly', () => {
    const steps: Step[] = [
      { step_order: 1, delay_days: 0, delay_hours: 1, subject: 'A', body: 'A', channel: 'email' },
      { step_order: 2, delay_days: 3, delay_hours: 0, subject: 'B', body: 'B', channel: 'email' },
    ];
    const result = removeStep(steps, 0);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('B');
    expect(result[0].step_order).toBe(1);
  });

  it('removes last step correctly', () => {
    const steps: Step[] = [
      { step_order: 1, delay_days: 0, delay_hours: 1, subject: 'A', body: 'A', channel: 'email' },
      { step_order: 2, delay_days: 3, delay_hours: 0, subject: 'B', body: 'B', channel: 'email' },
    ];
    const result = removeStep(steps, 1);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('A');
    expect(result[0].step_order).toBe(1);
  });
});
