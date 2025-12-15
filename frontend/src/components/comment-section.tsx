'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment, deleteComment, getComments } from '@/app/feed/actions'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
  profiles: {
    username: string
    avatar_url: string | null
  } | null
}

interface CommentSectionProps {
  imageId: string
  initialComments?: Comment[]
  initialCount?: number
}

export function CommentSection({ imageId, initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()

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
      await addComment(imageId, commentText)
      setCommentText('')
      
      // Refresh comments
      const updatedComments = await getComments(imageId, 50)
      setComments(updatedComments)
      
      toast({
        title: 'Success',
        description: 'Comment added',
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

    // Optimistic update
    setComments(comments.filter(c => c.id !== commentId))

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


  const displayedComments = showAll ? comments : comments.slice(0, 3)
  const hasMoreComments = comments.length > 3

  return (
    <div className="space-y-4">
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] resize-none"
            maxLength={500}
            disabled={isSubmitting}
          />
          <Button type="submit" size="icon" disabled={isSubmitting || !commentText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-sm font-semibold mr-2">
                      {comment.profiles?.username || 'Unknown'}
                    </span>
                    <span className="text-sm">{comment.content}</span>
                  </div>
                  {currentUserId && comment.isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.created_at)}
                </p>
              </div>
            </div>
          ))}
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

