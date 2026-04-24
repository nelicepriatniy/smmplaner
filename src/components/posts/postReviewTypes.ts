export type PostWorkflowStatus = "draft" | "pending" | "approved";

export const POST_STATUS_OPTIONS: { value: PostWorkflowStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "pending", label: "На подтверждении" },
  { value: "approved", label: "Одобрено" },
];

export type ReviewCommentAuthor = "self" | "client";

export type PostReviewComment = {
  id: string;
  side: ReviewCommentAuthor;
  text: string;
  createdAt: number;
};
