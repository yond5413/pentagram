'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment, deleteComment, getComments } from '@/app/feed/actions'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Send, Reply } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function formatTimeAgo(date: string): string {
  const now = new Date()
  const commentDate = new Date(date)
  const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return commentDate.toLocaleDateString()
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id?: string
  isOwner?: boolean
  parent_comment_id?: string | null
  profiles: {
    username: string
    avatar_url: string | null
  } | null
  replies?: Comment[]
  replyCount?: number
}

interface CommentSectionProps {
  imageId: string
  initialComments?: Comment[]
  initialCount?: number
}

export function CommentSection({ imageId, initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    async function loadComments() {
      const updatedComments = await getComments(imageId, 50)
      setComments(updatedComments)
    }
    if (!initialComments || initialComments.length === 0) {
      loadComments()
    } else {
      setComments(initialComments)
    }
  }, [imageId])

  useEffect(() => {
    async function getCurrentUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim()) {
      return
    }

    if (commentText.length > 500) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Comment is too long (max 500 characters)',
      })
      return
    }

    setIsSubmitting(true)
    const previousComments = [...comments]

    try {
      await addComment(imageId, commentText, replyingTo?.id)
      setCommentText('')
      setReplyingTo(null)
      
      // Refresh comments
      const updatedComments = await getComments(imageId, 50)
      setComments(updatedComments)
      
      // Expand replies if replying to a comment
      if (replyingTo) {
        setExpandedReplies(prev => new Set(prev).add(replyingTo.id))
      }
      
      toast({
        title: 'Success',
        description: replyingTo ? 'Reply added' : 'Comment added',
      })
    } catch (error) {
      setComments(previousComments)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    const previousComments = [...comments]

    // Optimistic update - need to recursively remove from tree
    const removeComment = (commentList: Comment[]): Comment[] => {
      return commentList
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies ? removeComment(c.replies) : undefined,
          replyCount: c.replies ? c.replies.filter(r => r.id !== commentId).length : 0,
        }))
    }

    setComments(removeComment(comments))

    try {
      await deleteComment(commentId)
      
      // Refresh comments
      const updatedComments = await getComments(imageId, 50)
      setComments(updatedComments)
      
      toast({
        title: 'Success',
        description: 'Comment deleted',
      })
    } catch (error) {
      setComments(previousComments)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
      })
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const countAllComments = (commentList: Comment[]): number => {
    return commentList.reduce((count, comment) => {
      return count + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
    }, 0)
  }

  const totalComments = countAllComments(comments)
  const displayedComments = showAll ? comments : comments.slice(0, 3)
  const hasMoreComments = comments.length > 3

  const renderComment = (comment: Comment, depth: number = 0): React.ReactNode => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const maxDepth = 2 // Show 2 levels by default, deeper levels require expansion

    return (
      <div key={comment.id} className={cn("space-y-2", depth > 0 && "ml-8 border-l-2 border-muted pl-4")}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.profiles?.avatar_url || ''} />
            <AvatarFallback>
              {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold mr-2">
                  {comment.profiles?.username || 'Unknown'}
                </span>
                <span className="text-sm break-words">{comment.content}</span>
              </div>
              {currentUserId && comment.isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatTimeAgo(comment.created_at)}</span>
              {currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setReplyingTo({ id: comment.id, username: comment.profiles?.username || 'Unknown' })}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-0 text-xs text-muted-foreground"
                onClick={() => toggleReplies(comment.id)}
              >
                {isExpanded ? 'Hide' : 'View'} {comment.replyCount || comment.replies?.length || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Render replies if expanded and within depth limit */}
        {hasReplies && isExpanded && (
          <div className="space-y-2 mt-2">
            {comment.replies?.map(reply => 
              depth < maxDepth 
                ? renderComment(reply, depth + 1)
                : (
                  <div key={reply.id} className="ml-8 border-l-2 border-muted pl-4">
                    {renderComment(reply, depth + 1)}
                  </div>
                )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
              <span>Replying to</span>
              <span className="font-semibold">@{replyingTo.username}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 ml-auto"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              className="min-h-[60px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <Button type="submit" size="icon" disabled={isSubmitting || !commentText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3">
          {displayedComments.map((comment) => renderComment(comment))}
          {hasMoreComments && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-sm"
            >
              View all {comments.length} comments
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

