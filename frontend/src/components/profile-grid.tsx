'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deletePost } from '@/app/post/[id]/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
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

interface ProfileGridProps {
  images: Array<{
    id: string
    image_url: string
    prompt: string
    is_deleted?: boolean
  }>
  isOwnProfile: boolean
  username: string
}

export function ProfileGrid({ images, isOwnProfile, username }: ProfileGridProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (imageId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDeletingId(imageId)
    try {
      const result = await deletePost(imageId)
      if (result?.success && result?.redirectTo) {
        toast({
          title: 'Success',
          description: 'Post deleted successfully',
        })
        // Refresh the page to update the grid (we're already on the profile page)
        router.refresh()
      }
    } catch (error) {
      setDeletingId(null)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
      })
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground border-t mt-4">
        No posts yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {images
        .filter(img => !img.is_deleted)
        .map((img) => (
          <Link
            key={img.id}
            href={`/post/${img.id}`}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            <Image
              src={img.image_url}
              alt={img.prompt}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      disabled={deletingId === img.id}
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
                        onClick={(e) => handleDelete(img.id, e)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingId === img.id ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </Link>
        ))}
    </div>
  )
}

