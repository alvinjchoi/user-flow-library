# 💬 Figma-Style Commenting Feature

## Overview
This feature adds Figma-style commenting to screenshots in the ScreenViewerModal, allowing users to add annotations with x,y coordinates.

## ✅ What's Already Done

### 1. Database Schema (`sql/ADD_SCREEN_COMMENTS.sql`)
- `screen_comments` table created with:
  - Position tracking (x_position, y_position as percentages)
  - User info (user_id, user_name, user_avatar)
  - Threading support (parent_comment_id)
  - Resolution status (is_resolved)
  - RLS policies for Clerk authentication

### 2. API Endpoints
- `GET /api/screens/[id]/comments` - Fetch all comments for a screen
- `POST /api/screens/[id]/comments` - Create new comment or reply
- `PATCH /api/comments/[id]` - Update comment (edit or resolve)
- `DELETE /api/comments/[id]` - Delete comment

### 3. UI Components
- `CommentPin` component - Shows comment pins with thread popup
- `NewCommentPin` component - For creating new comments
- Comment handlers added to ScreenViewerModal

## 🚧 What Needs to Be Added to ScreenViewerModal

### 1. Add Comment Button to Top Bar
In the top action bar (next to Edit, Replace, Close buttons), add:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsCommentMode(!isCommentMode)}
  className={isCommentMode ? "bg-blue-100" : ""}
>
  <MessageCircle className="w-4 h-4 mr-2" />
  {isCommentMode ? "Click to add comment" : "Comment"}
</Button>
```

### 2. Wrap Image with Click Handler
Find the main screenshot `<Image>` component and wrap its container with:

```tsx
<div 
  onClick={handleImageClick}
  style={{ position: "relative", cursor: isCommentMode ? "crosshair" : "default" }}
>
  {/* Existing Image component */}
  
  {/* Render comment pins */}
  {rootComments.map((comment) => (
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
  
  {/* Render new comment creation */}
  {newCommentPosition && (
    <NewCommentPin
      x={newCommentPosition.x}
      y={newCommentPosition.y}
      onSubmit={handleCreateComment}
      onCancel={() => setNewCommentPosition(null)}
    />
  )}
</div>
```

### 3. Add Comments Toggle to Sidebar
Add a section in the right sidebar to show/hide resolved comments:

```tsx
<div className="mb-4">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-white font-semibold text-sm">Comments</h3>
    <span className="text-white/60 text-xs">{rootComments.length}</span>
  </div>
  <Button
    variant="ghost"
    size="sm"
    className="w-full text-white/80"
    onClick={() => setIsCommentMode(true)}
  >
    <Plus className="w-4 h-4 mr-2" />
    Add Comment
  </Button>
</div>
```

## 📋 Setup Instructions

### 1. Run the Migration
```sql
-- Run this in Supabase SQL Editor
\i sql/ADD_SCREEN_COMMENTS.sql
```

### 2. Update Database Types
Add to `lib/database.types.ts`:

```typescript
screen_comments: {
  Row: {
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
  };
  Insert: {
    id?: string;
    screen_id: string;
    user_id: string;
    user_name?: string | null;
    user_avatar?: string | null;
    x_position: number;
    y_position: number;
    comment_text: string;
    is_resolved?: boolean;
    parent_comment_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    // ... similar to Insert
  };
};
```

### 3. Restart Dev Server
```bash
pnpm dev
```

## 🎨 Features

- **Click to Comment**: Click anywhere on screenshot to add a comment
- **Threaded Replies**: Reply to existing comments
- **Resolution**: Mark comment threads as resolved
- **Visual Indicators**: Color-coded pins (blue=active, green=resolved)
- **Counter Badges**: Shows number of comments in a thread
- **User Attribution**: Shows user avatar and name with each comment
- **Keyboard Shortcuts**: 
  - Cmd/Ctrl + Enter to submit
  - Esc to cancel

## 🔐 Security

- All API routes require Clerk authentication
- RLS policies ensure users can only edit/delete their own comments
- Comments are scoped to screens within accessible projects

## 📸 UI/UX Notes

- Comment pins are positioned using percentages for responsive scaling
- Pins appear on hover with subtle animation
- Comment threads open to the right of pins (like Figma)
- Resolved comments shown in green with checkmark
- Comment mode shows crosshair cursor

