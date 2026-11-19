import type { PublicObra, WorkPost } from './publication';

export function feedPosts(works: PublicObra[]) {
  return works.flatMap((work) => {
    if (!work.posts?.length) return [{ key: work.id, work, post: undefined as WorkPost | undefined }];
    return work.posts.map((post) => ({ key: post.id, work, post }));
  }).sort((a, b) => {
    const dateA = Date.parse(a.post?.publishedAt ?? a.work.publishedAt ?? '') || 0;
    const dateB = Date.parse(b.post?.publishedAt ?? b.work.publishedAt ?? '') || 0;
    return dateB - dateA || a.key.localeCompare(b.key);
  });
}
