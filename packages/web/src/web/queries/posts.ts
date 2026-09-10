import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePosts(input?: { tag?: string; limit?: number }) {
  return useQuery(orpc.posts.list.queryOptions({ input, staleTime: 30_000 }));
}

export function usePostTags() {
  return useQuery(orpc.posts.tags.queryOptions({ staleTime: 60_000 }));
}

export function usePost(slug: string) {
  return useQuery(orpc.posts.bySlug.queryOptions({ input: { slug }, staleTime: 30_000 }));
}

export function useAdminPosts(enabled: boolean) {
  return useQuery(orpc.posts.adminList.queryOptions({ enabled, retry: false }));
}

export function useAdminPost(id: number, enabled: boolean) {
  return useQuery(orpc.posts.adminGet.queryOptions({ input: { id }, enabled, retry: false }));
}

function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: orpc.posts.key() });
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation(orpc.posts.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation(orpc.posts.update.mutationOptions({ onSuccess: invalidate }));
}

export function useSetPostStatus() {
  const invalidate = useInvalidatePosts();
  return useMutation(orpc.posts.setStatus.mutationOptions({ onSuccess: invalidate }));
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();
  return useMutation(orpc.posts.remove.mutationOptions({ onSuccess: invalidate }));
}

export function usePresignUpload() {
  return useMutation(orpc.upload.presign.mutationOptions());
}
