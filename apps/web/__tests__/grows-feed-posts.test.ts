import { describe, expect, it } from 'vitest';
import { emptyPublication, readPublication } from '@/lib/obras/publication';
import { feedPosts } from '@/lib/obras/feed-posts';

describe('multiple publications per work', () => {
  it('keeps the work identity while ordering independent posts across works', () => {
    const first = {
      ...emptyPublication('Primera obra'), id: 'work-a',
      posts: [
        { id: 'a', title: 'Pliegos', text: 'Tareas para cotizar', author: 'Ana', publishedAt: '2026-11-19T11:00:00Z', category: 'pliegos' as const },
        { id: 'b', title: 'Proyecto', text: 'Presentación', author: 'Ana', publishedAt: '2026-11-19T09:00:00Z', category: 'proyecto' as const },
      ],
    };
    const second = { ...emptyPublication('Segunda obra'), id: 'work-b', publishedAt: '2026-11-19T10:00:00Z' };
    const posts = feedPosts([first, second]);
    expect(posts.map((entry) => entry.key)).toEqual(['a', 'work-b', 'b']);
    expect(posts.map((entry) => entry.work.id)).toEqual(['work-a', 'work-b', 'work-a']);
    expect(new Set(posts.map((entry) => entry.key)).size).toBe(3);
  });

  it('retains legacy publications and validates authored post fields', () => {
    const publication = emptyPublication('Obra histórica');
    const { posts, ...legacy } = publication;
    expect(readPublication(legacy)?.posts).toEqual([]);
    expect(readPublication({ ...publication, posts: [{ id: 'unsafe', title: 'Invalid' }] })).toBeNull();
  });
});
