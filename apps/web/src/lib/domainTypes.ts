import type { PostStatusValue } from "@feedbackhub/shared";

export type PostStatus = PostStatusValue;

export interface Board {
  id: string;
  orgId: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
}

export interface PostDTO {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
  status: PostStatus;
  createdAt: string;
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface VoteResult {
  voted: boolean;
  voteCount: number;
}
