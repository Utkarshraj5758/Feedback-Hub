import { z } from "zod";

export const postStatusSchema = z.enum(["open", "planned", "done"]);
export type PostStatusValue = z.infer<typeof postStatusSchema>;

export const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(120),
  isPublic: z.boolean().optional(),
});
export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.isPublic !== undefined, {
    message: "Provide at least one field to update",
  });
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Body is required").max(5000),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).max(5000).optional(),
  })
  .refine((v) => v.title !== undefined || v.body !== undefined, {
    message: "Provide at least one field to update",
  });
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const updatePostStatusSchema = z.object({
  status: postStatusSchema,
});
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>;

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
});
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
