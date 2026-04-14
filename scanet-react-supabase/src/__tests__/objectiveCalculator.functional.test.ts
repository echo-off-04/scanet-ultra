import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { calculateObjectiveValue, refreshAllObjectives, type PersonalObjective } from '../lib/objectiveCalculator';

vi.mock('../lib/currency', () => ({
  convertAllToBaseCurrency: vi.fn(async (items: Array<{ amount: number | null }>) => {
    return items.reduce((sum, i) => sum + (i.amount || 0), 0);
  }),
}));

const makeObjective = (overrides: Partial<PersonalObjective> = {}): PersonalObjective => ({
  id: 'obj-1',
  user_id: 'user-1',
  objective_type: 'new_contacts',
  title: 'Test',
  description: null,
  target_value: 10,
  current_value: 0,
  unit: 'number',
  currency: 'EUR',
  contact_status_filter: null,
  period_type: 'month',
  period_start: null,
  period_end: null,
  event_id: null,
  status: 'active',
  achieved_at: null,
  notified: false,
  priority: 'medium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

function createMockQuery(resolvedValue: unknown) {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
  };
  return query;
}

describe('calculateObjectiveValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates new_contacts by counting contacts', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    Object.defineProperty(mockQuery, 'count', { value: 15, writable: true });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const obj = makeObjective({ objective_type: 'new_contacts' });
    const result = await calculateObjectiveValue(obj);

    expect(supabase.from).toHaveBeenCalledWith('contacts');
    expect(typeof result).toBe('number');
  });

  it('calculates contacts_by_status with status filter', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const obj = makeObjective({
      objective_type: 'contacts_by_status',
      contact_status_filter: 'client',
    });
    await calculateObjectiveValue(obj);

    expect(supabase.from).toHaveBeenCalledWith('contacts');
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'client');
  });

  it('defaults contacts_by_status filter to "lead" when none provided', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const obj = makeObjective({
      objective_type: 'contacts_by_status',
      contact_status_filter: null,
    });
    await calculateObjectiveValue(obj);

    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'lead');
  });

  it('calculates revenue from won opportunities', async () => {
    const data = [
      { amount: 1000, currency: 'EUR', created_at: '2026-01-15' },
      { amount: 500, currency: 'EUR', created_at: '2026-01-16' },
    ];

    const chainable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: (resolve: (v: any) => void) => {
        resolve({ data, error: null });
        return Promise.resolve({ data, error: null });
      },
    };
    vi.mocked(supabase.from).mockReturnValue(chainable as any);

    const obj = makeObjective({ objective_type: 'revenue', currency: 'EUR' });
    const result = await calculateObjectiveValue(obj);

    expect(supabase.from).toHaveBeenCalledWith('contact_opportunities');
    expect(typeof result).toBe('number');
  });

  it('calculates win_rate from won/lost opportunities', async () => {
    const data = [
      { status: 'won', created_at: '2026-01-15' },
      { status: 'won', created_at: '2026-01-16' },
      { status: 'lost', created_at: '2026-01-17' },
    ];
    const mockQuery = createMockQuery({ data, error: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    vi.spyOn(mockQuery, 'lte').mockReturnThis();
    vi.spyOn(mockQuery, 'gte').mockReturnThis();
    vi.spyOn(mockQuery, 'in').mockReturnThis();
    vi.spyOn(mockQuery, 'eq').mockReturnThis();
    vi.spyOn(mockQuery, 'select').mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data, error: null }),
          }),
        }),
      }),
    } as any);

    const obj = makeObjective({ objective_type: 'win_rate' });
    const result = await calculateObjectiveValue(obj);

    expect(supabase.from).toHaveBeenCalledWith('contact_opportunities');
    expect(typeof result).toBe('number');
  });

  it('calculates participation_rate from events', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const obj = makeObjective({ objective_type: 'participation_rate' });
    await calculateObjectiveValue(obj);

    expect(supabase.from).toHaveBeenCalledWith('events');
  });

  it('returns 0 for unknown objective type', async () => {
    const obj = makeObjective({ objective_type: 'unknown' as any });
    const result = await calculateObjectiveValue(obj);
    expect(result).toBe(0);
  });

  it('applies period_start and period_end filters', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const obj = makeObjective({
      objective_type: 'new_contacts',
      period_start: '2026-01-01',
      period_end: '2026-01-31',
    });
    await calculateObjectiveValue(obj);

    expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2026-01-01');
    expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2026-01-31');
  });
});

describe('refreshAllObjectives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no active objectives exist', async () => {
    const mockQuery = createMockQuery({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      ...mockQuery,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as any);

    const result = await refreshAllObjectives('user-1');
    expect(result).toEqual([]);
  });

  it('returns empty array on fetch error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    } as any);

    const result = await refreshAllObjectives('user-1');
    expect(result).toEqual([]);
  });

  it('calls supabase.from with personal_objectives table', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as any);

    await refreshAllObjectives('user-1');
    expect(supabase.from).toHaveBeenCalledWith('personal_objectives');
  });
});
