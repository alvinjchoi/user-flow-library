"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export interface ScreenComment {
  id: string;
  screen_id: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  x_position: number;
  y_position: number;
  comment_text: string;
  is_resolved: boolean;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CommentPinProps {
  comment: ScreenComment;
  replies: ScreenComment[];
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onReply: (text: string) => Promise<void>;
  onResolve: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function CommentPin({
  comment,
  replies,
  isActive,
  onClick,
  onClose,
  onReply,
  onResolve,
  onDelete,
}: CommentPinProps) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(replyText);
      setReplyText("");
    } catch (error) {
      console.error("Error replying:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allComments = [comment, ...replies];
  const unresolvedCount = allComments.filter((c) => !c.is_resolved).length;

  return (
    <div
      className="absolute"
      style={{
        left: `${comment.x_position}%`,
        top: `${comment.y_position}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Pin marker */}
      <button
        onClick={onClick}
        className={`relative w-8 h-8 rounded-full shadow-lg transition-all ${
          comment.is_resolved
            ? "bg-green-500"
            : isActive
            ? "bg-blue-500 scale-110"
            : "bg-white border-2 border-blue-500"
        } hover:scale-110 flex items-center justify-center group`}
      >
        {comment.is_resolved ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:w-3 group-hover:h-3 transition-all" />
        )}
        {unresolvedCount > 1 && !comment.is_resolved && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unresolvedCount}
          </div>
        )}
      </button>

      {/* Comment thread popup */}
      {isActive && (
        <div
          className="absolute left-10 top-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {allComments.length} Comment{allComments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!comment.is_resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResolve}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-3">
            {allComments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="flex-shrink-0">
                  {c.user_avatar ? (
                    <Image
                      src={c.user_avatar}
                      alt={c.user_name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                      {(c.user_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {c.user_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {c.comment_text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          {!comment.is_resolved && (
            <div className="p-3 border-t">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] mb-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleReply();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmitting}
                >
                  <Send className="w-3 h-3 mr-1" />
                  {isSubmitting ? "Sending..." : "Reply"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// New comment creation component
interface NewCommentPinProps {
  x: number;
  y: number;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

export function NewCommentPin({
  x,
  y,
  onSubmit,
  onCancel,
}: NewCommentPinProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(commentText);
    } catch (error) {
      console.error("Error creating comment:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pin marker */}
      <div className="w-8 h-8 rounded-full bg-blue-500 shadow-lg animate-pulse flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full" />
      </div>

      {/* Comment input */}
      <div className="absolute left-10 top-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        <div className="p-3">
          <Textarea
            autoFocus
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] mb-2"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onCancel();
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

