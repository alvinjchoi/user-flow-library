"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Edit2, Upload, ImageIcon, Plus, Trash2, MessageCircle, Check } from "lucide-react";
import Image from "next/image";
import type { Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  getScreenInspirations,
  addScreenInspiration,
  removeScreenInspiration,
} from "@/lib/inspirations";
import { CommentPin, NewCommentPin, type ScreenComment } from "./comment-pin";

interface ScreenViewerModalProps {
  screen: Screen | null;
  allScreens: Screen[];
  onClose: () => void;
  onNavigate?: (screen: Screen) => void;
  onEdit?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  readOnly?: boolean;
}

export function ScreenViewerModal({
  screen,
  allScreens,
  onClose,
  onNavigate,
  onEdit,
  onUploadScreenshot,
  readOnly = false,
}: ScreenViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inspirations, setInspirations] = useState<Screen[]>([]);
  const [isAddingInspiration, setIsAddingInspiration] = useState(false);
  const [loadingInspirations, setLoadingInspirations] = useState(false);
  
  // Comment state
  const [comments, setComments] = useState<ScreenComment[]>([]);
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);


  // Update current index when screen changes
  useEffect(() => {
    if (screen) {
      const index = allScreens.findIndex((s) => s.id === screen.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [screen, allScreens]);

  // Calculate current screen - stabilized with useMemo to prevent unnecessary re-renders
  const currentScreen = useMemo(() => {
    return allScreens[currentIndex] || screen;
  }, [allScreens, currentIndex, screen?.id]); // Only change when ID actually changes

  // Load inspirations when current screen changes
  useEffect(() => {
    const loadInspirations = async () => {
      if (!currentScreen) return;
      
      setLoadingInspirations(true);
      try {
        const inspos = await getScreenInspirations(currentScreen.id);
        setInspirations(inspos);
      } catch (error) {
        console.error("Error loading inspirations:", error);
        setInspirations([]);
      } finally {
        setLoadingInspirations(false);
      }
    };

    loadInspirations();
  }, [currentScreen?.id]);

  // Load comments when current screen changes
  useEffect(() => {
    // Reset comment UI state when screen changes (but not comments themselves until loaded)
    setActiveCommentId(null);
    setIsCommentMode(false);
    setNewCommentPosition(null);

    // Create abort controller to cancel in-flight requests
    const abortController = new AbortController();

    const loadComments = async () => {
      if (!currentScreen) {
        setComments([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/screens/${currentScreen.id}/comments`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          console.error("Failed to load comments:", response.statusText);
          setComments([]);
          return;
        }
        
        const data = await response.json();
        setComments(data.comments || []);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error loading comments:", error);
        setComments([]);
      }
    };

    loadComments();

    // Cleanup: abort fetch if screen changes before it completes
    return () => {
      abortController.abort();
    };
  }, [currentScreen?.id]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allScreens.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate?.(allScreens[newIndex]);
    }
  }, [hasPrevious, currentIndex, allScreens, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate?.(allScreens[newIndex]);
    }
  }, [hasNext, currentIndex, allScreens, onNavigate]);

  const handleAddInspiration = async (relatedScreenId: string) => {
    if (!currentScreen) return;

    try {
      await addScreenInspiration(currentScreen.id, relatedScreenId);
      const inspos = await getScreenInspirations(currentScreen.id);
      setInspirations(inspos);
      setIsAddingInspiration(false);
    } catch (error) {
      console.error("Error adding inspiration:", error);
      alert("Failed to add inspiration");
    }
  };

  const handleRemoveInspiration = async (relatedScreenId: string) => {
    if (!currentScreen) return;

    try {
      await removeScreenInspiration(currentScreen.id, relatedScreenId);
      setInspirations(inspirations.filter((s) => s.id !== relatedScreenId));
    } catch (error) {
      console.error("Error removing inspiration:", error);
      alert("Failed to remove inspiration");
    }
  };

  // Comment handling functions
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !isCommentMode || !currentScreen) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewCommentPosition({ x, y });
    setIsCommentMode(false);
  };

  const handleCreateComment = async (commentText: string) => {
    if (!currentScreen || !newCommentPosition) return;

    try {
      const response = await fetch(`/api/screens/${currentScreen.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x_position: newCommentPosition.x,
          y_position: newCommentPosition.y,
          comment_text: commentText,
        }),
      });

      if (response.ok) {
        const { comment } = await response.json();
        setComments((prev) => [...prev, comment]);
        setNewCommentPosition(null);
        setActiveCommentId(comment.id);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to create comment");
    }
  };

  const handleReplyToComment = async (parentId: string, replyText: string) => {
    if (!currentScreen) return;

    try {
      const parentComment = comments.find((c) => c.id === parentId);
      if (!parentComment) return;

      const response = await fetch(`/api/screens/${currentScreen.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x_position: parentComment.x_position,
          y_position: parentComment.y_position,
          comment_text: replyText,
          parent_comment_id: parentId,
        }),
      });

      if (response.ok) {
        const { comment } = await response.json();
        setComments((prev) => [...prev, comment]);
      }
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_resolved: true }),
      });

      if (response.ok) {
        const { comment: updatedComment } = await response.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updatedComment : c))
        );
        setActiveCommentId(null);
      } else {
        const errorData = await response.json();
        console.error("Error resolving comment:", errorData);
        alert("Failed to resolve comment: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error resolving comment:", error);
      alert("Failed to resolve comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setActiveCommentId(null);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // Group comments by parent
  const rootComments = comments.filter((c) => !c.parent_comment_id);
  const getCommentReplies = (commentId: string) =>
    comments.filter((c) => c.parent_comment_id === commentId);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrevious, handleNext]);

  if (!screen || !currentScreen) return null;

  // Get suggested screens (same flow, excluding current screen and already added inspirations)
  const inspirationIds = new Set(inspirations.map((s) => s.id));
  const suggestedScreens = allScreens
    .filter(
      (s) =>
        s.flow_id === currentScreen.flow_id &&
        s.id !== currentScreen.id &&
        !inspirationIds.has(s.id)
    )
    .slice(0, 4); // Limit suggestions

  // Available screens for adding (excluding current screen and already added)
  const availableScreens = allScreens.filter(
    (s) => s.id !== currentScreen.id && !inspirationIds.has(s.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">
              {currentScreen.display_name || currentScreen.title}
            </h2>
            {currentScreen.notes && (
              <p className="text-white/80 text-sm mt-1">
                {currentScreen.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCommentMode(!isCommentMode)}
              className={`${
                isCommentMode
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-white/10 hover:bg-white/20"
              } text-white border-white/20`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isCommentMode ? "Click to add" : "Comment"}
            </Button>
          )}
          {!readOnly && onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(currentScreen)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {!readOnly && onUploadScreenshot && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUploadScreenshot(currentScreen.id)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentScreen.screenshot_url ? "Replace" : "Upload"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-24 pb-16">
        {/* Left Side - Image Viewer */}
        <div className="flex-1 relative flex items-center justify-center px-20">
          {/* Previous Button */}
          {hasPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Image */}
          {currentScreen.screenshot_url ? (
            <div 
              className="relative max-w-[600px] max-h-full aspect-[9/19.5]"
              onClick={handleImageClick}
              style={{ cursor: isCommentMode ? "crosshair" : "default" }}
            >
              <img
                src={currentScreen.screenshot_url}
                alt={currentScreen.title}
                className="w-full h-full object-contain rounded-[27px] shadow-2xl"
                style={{
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }}
              />
              
              {/* Comment pins (hidden in read-only mode) */}
              {!readOnly && rootComments.map((comment) => (
                <CommentPin
                  key={comment.id}
                  comment={comment}
                  replies={getCommentReplies(comment.id)}
                  isActive={activeCommentId === comment.id}
                  onClick={() => setActiveCommentId(comment.id)}
                  onClose={() => setActiveCommentId(null)}
                  onReply={(text) => handleReplyToComment(comment.id, text)}
                  onResolve={() => handleResolveComment(comment.id)}
                  onDelete={() => handleDeleteComment(comment.id)}
                />
              ))}
              
              {/* New comment creation (hidden in read-only mode) */}
              {!readOnly && newCommentPosition && (
                <NewCommentPin
                  x={newCommentPosition.x}
                  y={newCommentPosition.y}
                  onSubmit={handleCreateComment}
                  onCancel={() => setNewCommentPosition(null)}
                />
              )}
            </div>
          ) : (
            <div className="relative max-w-[600px] aspect-[9/19.5] bg-muted rounded-[27px] flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No screenshot</p>
              </div>
            </div>
          )}

          {/* Next Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}
        </div>

        {/* Right Sidebar - Comments & Inspos */}
        <div className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-sm overflow-y-auto flex-shrink-0">
          <div className="p-4">
            {/* Comments Section (hidden in read-only mode) */}
            {!readOnly && comments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">
                    Comments ({comments.filter((c) => !c.parent_comment_id).length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCommentMode(true)}
                    className="h-7 text-white/80 hover:text-white hover:bg-white/10 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {rootComments.map((comment) => {
                    const replies = getCommentReplies(comment.id);
                    const totalComments = 1 + replies.length;
                    const isActive = activeCommentId === comment.id;
                    
                    return (
                      <button
                        key={comment.id}
                        onClick={() => setActiveCommentId(comment.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : comment.is_resolved
                            ? "bg-green-500/10 border border-green-500/30 hover:bg-green-500/20"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {comment.user_avatar ? (
                            <img
                              src={comment.user_avatar}
                              alt={comment.user_name || "User"}
                              className="w-6 h-6 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                              {(comment.user_name || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white/90 text-xs font-medium truncate">
                                {comment.user_name || "Anonymous"}
                              </span>
                              {comment.is_resolved && (
                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                              {totalComments > 1 && (
                                <span className="text-white/50 text-xs">
                                  {totalComments}
                                </span>
                              )}
                            </div>
                            <p className="text-white/70 text-xs line-clamp-2">
                              {comment.comment_text}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Comment Button (if no comments exist, hidden in read-only mode) */}
            {!readOnly && comments.length === 0 && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCommentMode(true)}
                  className="w-full bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Other Inspos</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingInspiration(!isAddingInspiration)}
                className="h-7 text-white/80 hover:text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Add Inspiration Mode */}
            {isAddingInspiration && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-white/70 text-xs mb-2">
                  Select a screen to add as inspiration:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableScreens.length === 0 ? (
                    <p className="text-white/50 text-xs text-center py-4">
                      No screens available
                    </p>
                  ) : (
                    availableScreens.map((availableScreen) => (
                      <button
                        key={availableScreen.id}
                        onClick={() => handleAddInspiration(availableScreen.id)}
                        className="w-full text-left px-2 py-1.5 text-xs text-white/80 hover:bg-white/10 rounded transition-colors"
                      >
                        {availableScreen.display_name || availableScreen.title}
                      </button>
                    ))
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingInspiration(false)}
                  className="mt-2 w-full h-7 text-xs text-white/60 hover:text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            )}

            {loadingInspirations ? (
              <p className="text-white/60 text-xs text-center py-8">
                Loading...
              </p>
            ) : (
              <>
                {/* Manual Inspirations */}
                {inspirations.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {inspirations.map((inspiration) => (
                      <div
                        key={inspiration.id}
                        className="relative bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all group"
                      >
                        <button
                          onClick={() => {
                            const index = allScreens.findIndex(
                              (s) => s.id === inspiration.id
                            );
                            if (index !== -1) {
                              setCurrentIndex(index);
                              onNavigate?.(inspiration);
                            }
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-16 h-28 bg-white/5 rounded-md flex-shrink-0 overflow-hidden">
                              {inspiration.screenshot_url ? (
                                <img
                                  src={inspiration.screenshot_url}
                                  alt={inspiration.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-white/30" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {inspiration.display_name || inspiration.title}
                              </p>
                              {inspiration.notes && (
                                <p className="text-white/50 text-xs mt-1 line-clamp-2">
                                  {inspiration.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveInspiration(inspiration.id)}
                          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove inspiration"
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Screens */}
                {suggestedScreens.length > 0 && (
                  <div>
                    <h4 className="text-white/60 text-xs font-medium mb-2 mt-4">
                      Suggested (Same Flow)
                    </h4>
                    <div className="space-y-2">
                      {suggestedScreens.map((suggested) => (
                        <button
                          key={suggested.id}
                          onClick={() => {
                            const index = allScreens.findIndex(
                              (s) => s.id === suggested.id
                            );
                            if (index !== -1) {
                              setCurrentIndex(index);
                              onNavigate?.(suggested);
                            }
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-all text-left group"
                        >
                          <div className="flex gap-2">
                            {/* Smaller Thumbnail */}
                            <div className="w-12 h-20 bg-white/5 rounded-md flex-shrink-0 overflow-hidden">
                              {suggested.screenshot_url ? (
                                <img
                                  src={suggested.screenshot_url}
                                  alt={suggested.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-white/30" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {suggested.display_name || suggested.title}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {inspirations.length === 0 && suggestedScreens.length === 0 && (
                  <p className="text-white/60 text-xs text-center py-8">
                    No inspirations yet. Click "Add" to add some!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Screen counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
        <p className="text-white text-sm">
          {currentIndex + 1} / {allScreens.length}
        </p>
      </div>

      {/* Click outside to close - only on the main area, not on sidebar */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
}



