import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateBoardInput,
  CreateCommentInput,
  CreatePostInput,
} from "@feedbackhub/shared";
import * as api from "./domainApi";
import type { PostDTO, PostStatus } from "./domainTypes";

export const qk = {
  boards: ["boards"] as const,
  board: (id: string) => ["board", id] as const,
  posts: (boardId: string) => ["posts", boardId] as const,
  post: (id: string) => ["post", id] as const,
  comments: (postId: string) => ["comments", postId] as const,
};

export function useBoards() {
  return useQuery({ queryKey: qk.boards, queryFn: api.listBoards });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: qk.board(id),
    queryFn: () => api.getBoard(id),
    enabled: Boolean(id),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBoardInput) => api.createBoard(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
}

export function usePosts(boardId: string) {
  return useQuery({
    queryKey: qk.posts(boardId),
    queryFn: () => api.listPosts(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCreatePost(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(boardId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.posts(boardId) }),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: qk.post(id),
    queryFn: () => api.getPost(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePostStatus(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PostStatus }) =>
      api.updatePostStatus(id, { status }),
    onSuccess: (post) => {
      qc.setQueryData(qk.post(post.id), post);
      void qc.invalidateQueries({ queryKey: qk.posts(boardId) });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: qk.comments(postId),
    queryFn: () => api.listComments(postId),
    enabled: Boolean(postId),
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => api.createComment(postId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(postId) });
      void qc.invalidateQueries({ queryKey: qk.post(postId) }); // commentCount
    },
  });
}

const flipVote = (p: PostDTO): PostDTO => ({
  ...p,
  hasVoted: !p.hasVoted,
  voteCount: p.voteCount + (p.hasVoted ? -1 : 1),
});

/**
 * Optimistic vote toggle. Patches the post wherever it's cached (detail +
 * board list), rolls back on error, and reconciles with the server on settle.
 */
export function useToggleVote(postId: string, boardId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.toggleVote(postId),
    onMutate: async () => {
      const postKey = qk.post(postId);
      const listKey = boardId ? qk.posts(boardId) : null;
      await qc.cancelQueries({ queryKey: postKey });
      if (listKey) await qc.cancelQueries({ queryKey: listKey });

      const prevPost = qc.getQueryData<PostDTO>(postKey);
      const prevList = listKey
        ? qc.getQueryData<PostDTO[]>(listKey)
        : undefined;

      if (prevPost) qc.setQueryData<PostDTO>(postKey, flipVote(prevPost));
      if (listKey && prevList) {
        qc.setQueryData<PostDTO[]>(
          listKey,
          prevList.map((p) => (p.id === postId ? flipVote(p) : p)),
        );
      }
      return { prevPost, prevList, listKey };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevPost) qc.setQueryData(qk.post(postId), ctx.prevPost);
      if (ctx.listKey && ctx.prevList) {
        qc.setQueryData(ctx.listKey, ctx.prevList);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.post(postId) });
      if (boardId) void qc.invalidateQueries({ queryKey: qk.posts(boardId) });
    },
  });
}
