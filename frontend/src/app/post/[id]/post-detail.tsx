'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Trash2, ArrowLeft } from 'lucide-react'
import { CommentSection } from '@/components/comment-section'
import { toggleLike } from '@/app/feed/actions'
import { deletePost } from './actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface PostDetailProps {
  post: {
    id: string
    image_url: string
    prompt: string
    negative_prompt: string | null
    created_at: string
    likesCount: number
    commentsCount: number
    userHasLiked: boolean
    isOwner: boolean
    profiles: {
      id: string
      username: string
      avatar_url: string | null
      display_name: string | null
    } | null
  }
}

export function PostDetail({ post }: PostDetailProps) {
  const [liked, setLiked] = useState(post.userHasLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLike = async () => {
    const previousLiked = liked
    const previousCount = likesCount

    // Optimistic update
    setLiked(!liked)
    setLikesCount(prev => liked ? prev - 1 : prev + 1)

    try {
      await toggleLike(post.id)
    } catch (e) {
      // Revert on error
      setLiked(previousLiked)
      setLikesCount(previousCount)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update like',
      })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deletePost(post.id)
      if (result?.success && result?.redirectTo) {
        toast({
          title: 'Success',
          description: 'Post deleted successfully',
        })
        // Clean redirect after a brief delay to show the toast
        setTimeout(() => {
          router.push(result.redirectTo)
        }, 500)
      }
    } catch (error) {
      setIsDeleting(false)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
      })
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link
            href={`/profile/${post.profiles?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback>
                {post.profiles?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.profiles?.username || 'Unknown User'}</p>
              {post.profiles?.display_name && (
                <p className="text-sm text-muted-foreground">{post.profiles.display_name}</p>
              )}
            </div>
          </Link>
          {post.isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this post? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Image */}
        <div className="relative w-full aspect-square bg-muted">
          <Image
            src={post.image_url}
            alt={post.prompt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            priority
          />
        </div>

        {/* Actions and Caption */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(liked && "text-red-500 hover:text-red-600")}
            >
              <Heart className={cn("h-6 w-6", liked && "fill-current")} />
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </div>
          </div>

          {likesCount > 0 && (
            <div className="text-sm font-medium">
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm">
              <Link
                href={`/profile/${post.profiles?.username}`}
                className="font-semibold hover:underline mr-2"
              >
                {post.profiles?.username || 'Unknown User'}
              </Link>
              {post.prompt}
            </p>
            {post.negative_prompt && (
              <p className="text-xs text-muted-foreground">
                Negative: {post.negative_prompt}
              </p>
            )}
          </div>

          {/* Comments */}
          <CommentSection imageId={post.id} />
        </div>
      </div>
    </div>
  )
}

