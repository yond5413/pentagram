'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import Image from 'next/image'
import { toggleLike } from '@/app/feed/actions'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CommentSection } from '@/components/comment-section'
import { useToast } from '@/hooks/use-toast'

interface PostCardProps {
    image: {
        id: string
        image_url: string
        prompt: string
        likesCount?: number
        commentsCount?: number
        userHasLiked?: boolean
        profiles: {
            username: string
            avatar_url: string | null
        } | null // Relation might be null if user deleted?
    }
}

export function PostCard({ image }: PostCardProps) {
    const [liked, setLiked] = useState(image.userHasLiked || false)
    const [likesCount, setLikesCount] = useState(image.likesCount || 0)
    const { toast } = useToast()

    const handleLike = async () => {
        const previousLiked = liked
        const previousCount = likesCount

        // Optimistic update
        setLiked(!liked)
        setLikesCount(prev => liked ? prev - 1 : prev + 1)

        try {
            await toggleLike(image.id)
        } catch {
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

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar>
                    <AvatarImage src={image.profiles?.avatar_url || ''} />
                    <AvatarFallback>{image.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="text-sm font-medium">{image.profiles?.username || 'Unknown User'}</p>
                    {/* Timestamp could go here */}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative aspect-square w-full">
                    <Image
                        src={image.image_url}
                        alt={image.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        <span className="font-semibold text-foreground mr-2">{image.profiles?.username}</span>
                        {image.prompt}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                <div className="flex gap-4 w-full">
                    <Button variant="ghost" size="icon" onClick={handleLike} className={cn(liked && "text-red-500 hover:text-red-600")}>
                        <Heart className={cn("h-6 w-6 transition-all", liked && "fill-current scale-110")} />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Share2 className="h-6 w-6" />
                    </Button>
                </div>
                {likesCount > 0 && (
                    <div className="text-sm font-medium w-full">
                        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                    </div>
                )}
                {image.commentsCount !== undefined && image.commentsCount > 0 && (
                    <div className="text-sm text-muted-foreground w-full">
                        {image.commentsCount} {image.commentsCount === 1 ? 'comment' : 'comments'}
                    </div>
                )}
            </CardFooter>
            <div className="px-4 pb-4">
                <CommentSection imageId={image.id} />
            </div>
        </Card>
    )
}
