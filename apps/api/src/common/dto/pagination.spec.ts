import { cursorArgs, sliceCursorPage } from './pagination.dto';

describe('cursorArgs', () => {
  it('requests one extra row and no cursor on the first page', () => {
    expect(cursorArgs({ limit: 20 })).toEqual({ take: 21 });
  });

  it('adds skip + cursor once a cursor id is provided', () => {
    expect(cursorArgs({ limit: 20, cursor: 'abc' })).toEqual({
      take: 21,
      skip: 1,
      cursor: { id: 'abc' },
    });
  });
});

describe('sliceCursorPage', () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `row-${i}` }));

  it('reports no next page when fewer rows than limit+1 come back', () => {
    const result = sliceCursorPage(rows(3), 20);
    expect(result.items).toHaveLength(3);
    expect(result.nextCursor).toBeNull();
  });

  it('slices off the lookahead row and sets nextCursor to the last kept item', () => {
    const result = sliceCursorPage(rows(21), 20);
    expect(result.items).toHaveLength(20);
    expect(result.nextCursor).toBe('row-19');
  });

  it('exact-boundary case: limit+1 present means there IS a next page even though it could be empty', () => {
    const result = sliceCursorPage(rows(21), 20);
    expect(result.nextCursor).not.toBeNull();
  });
});
