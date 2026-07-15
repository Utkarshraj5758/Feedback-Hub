import type {
  CreateBoardInput,
  CreateCommentInput,
  CreatePostInput,
  UpdatePostStatusInput,
} from "@feedbackhub/shared";
import { apiJson, jsonBody } from "./apiClient";
import type { Board, CommentDTO, PostDTO, VoteResult } from "./domainTypes";

// --- Boards ---
export const listBoards = () =>
  apiJson<{ boards: Board[] }>("/boards").then((r) => r.boards);

export const getBoard = (id: string) =>
  apiJson<{ board: Board }>(`/boards/${id}`).then((r) => r.board);

export const createBoard = (input: CreateBoardInput) =>
  apiJson<{ board: Board }>("/boards", {
    method: "POST",
    ...jsonBody(input),
  }).then((r) => r.board);

// --- Posts ---
export const listPosts = (boardId: string) =>
  apiJson<{ posts: PostDTO[] }>(`/boards/${boardId}/posts`).then(
    (r) => r.posts,
  );

export const getPost = (id: string) =>
  apiJson<{ post: PostDTO }>(`/posts/${id}`).then((r) => r.post);

export const createPost = (boardId: string, input: CreatePostInput) =>
  apiJson<{ post: PostDTO }>(`/boards/${boardId}/posts`, {
    method: "POST",
    ...jsonBody(input),
  }).then((r) => r.post);

export const updatePostStatus = (id: string, input: UpdatePostStatusInput) =>
  apiJson<{ post: PostDTO }>(`/posts/${id}/status`, {
    method: "PATCH",
    ...jsonBody(input),
  }).then((r) => r.post);

// --- Votes ---
export const toggleVote = (postId: string) =>
  apiJson<VoteResult>(`/posts/${postId}/vote`, { method: "POST" });

// --- Comments ---
export const listComments = (postId: string) =>
  apiJson<{ comments: CommentDTO[] }>(`/posts/${postId}/comments`).then(
    (r) => r.comments,
  );

export const createComment = (postId: string, input: CreateCommentInput) =>
  apiJson<{ comment: CommentDTO }>(`/posts/${postId}/comments`, {
    method: "POST",
    ...jsonBody(input),
  }).then((r) => r.comment);
