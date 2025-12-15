'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleLike(imageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Check if liked
    const { data: existingLike } = await supabase
        .from('image_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('image_id', imageId)
        .single()

    if (existingLike) {
        // Unlike
        await supabase
            .from('image_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('image_id', imageId)
    } else {
        // Like
        await supabase
            .from('image_likes')
            .insert({
                user_id: user.id,
                image_id: imageId
            })
    }

    revalidatePath('/feed')
    revalidatePath('/explore')
}

export async function getFeedImages() {
    const supabase = await createClient()

    // For MVP: Get latest public images
    // TODO: Implement the popularity score sorting
    // Process the result to add a boolean for user_has_liked 
    // This is tricky with simple select, often requires a separate query or auth.uid() trick in view
    // For now, let's fetch strictly for public view and maybe hydrate client side or improve query

    // We can't easily filter the nested image_likes!inner by current user in the same query 
    // without filtering the parent rows if we're not careful.
    // Instead, let's just fetch basic info + check likes securely separately or use a view.

    // Better approach for "user_has_liked":
    // 1. Fetch images
    // 2. If user logged in, fetch list of their likes for these image IDs.

    // Let's re-query simpler first
    const { data: simpleImages } = await supabase
        .from('images')
        .select(`
            *,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20)

    if (!simpleImages) return []

    // Fetch counts and user status
    // This is N+1 if not careful, but for 20 items it's okay to do one aggregate query or just rpc?
    // Let's stick to basics:
    // We already have tables.

    // Let's return raw data and let a component handle the "liked" state via client or a smarter join
    // Actually, Supabase has a nice way to do this with `.select('*, likes:image_likes(count)')`

    return simpleImages.map(img => ({
        ...img,
        likes_count: 0, // Placeholder, would need aggregate
        has_liked: false // Placeholder
    }))
}

export async function addComment(imageId: string, content: string, parentCommentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    if (!content.trim()) {
        throw new Error('Comment cannot be empty')
    }

    if (content.length > 500) {
        throw new Error('Comment is too long (max 500 characters)')
    }

    const commentData: {
        image_id: string
        user_id: string
        content: string
        parent_comment_id?: string
    } = {
        image_id: imageId,
        user_id: user.id,
        content: content.trim(),
    }

    if (parentCommentId) {
        commentData.parent_comment_id = parentCommentId
    }

    const { error } = await supabase
        .from('comments')
        .insert(commentData)

    if (error) {
        console.error('Error adding comment:', error)
        throw new Error('Failed to add comment')
    }

    revalidatePath('/feed')
    revalidatePath('/explore')
    revalidatePath(`/post/${imageId}`)
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Verify the comment belongs to the user and get image_id for revalidation
    const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id, image_id')
        .eq('id', commentId)
        .single()

    if (fetchError || !comment) {
        throw new Error('Comment not found')
    }

    if (comment.user_id !== user.id) {
        throw new Error('Unauthorized to delete this comment')
    }

    const imageId = comment.image_id

    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

    if (error) {
        console.error('Error deleting comment:', error)
        throw new Error('Failed to delete comment')
    }

    revalidatePath('/feed')
    revalidatePath('/explore')
    if (imageId) {
        revalidatePath(`/post/${imageId}`)
    }
}

interface CommentWithReplies {
    id: string
    content: string
    created_at: string
    user_id: string
    parent_comment_id: string | null
    isOwner: boolean
    profiles: {
        username: string
        avatar_url: string | null
    } | null
    replies?: CommentWithReplies[]
    replyCount?: number
}

export async function getComments(imageId: string, limit: number = 50): Promise<CommentWithReplies[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all comments for this image (including replies)
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            parent_comment_id,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .eq('image_id', imageId)
        .order('created_at', { ascending: true }) // Oldest first for better reply ordering

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    if (!comments || comments.length === 0) {
        return []
    }

    // Transform profiles and add ownership flag
    const commentsWithOwnership: CommentWithReplies[] = (comments || []).map(comment => {
        // Transform profiles from array to single object or null
        let profile: { username: string; avatar_url: string | null } | null = null
        if (comment.profiles) {
            if (Array.isArray(comment.profiles) && comment.profiles.length > 0) {
                profile = {
                    username: comment.profiles[0].username,
                    avatar_url: comment.profiles[0].avatar_url,
                }
            } else if (!Array.isArray(comment.profiles)) {
                const profileData = comment.profiles as { username: string; avatar_url: string | null }
                profile = {
                    username: profileData.username,
                    avatar_url: profileData.avatar_url,
                }
            }
        }

        return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            parent_comment_id: comment.parent_comment_id || null,
            isOwner: user?.id === comment.user_id,
            profiles: profile,
            replies: [],
            replyCount: 0,
        }
    })

    // Build hierarchical structure
    const commentMap = new Map<string, CommentWithReplies>()
    const topLevelComments: CommentWithReplies[] = []

    // First pass: create map of all comments
    commentsWithOwnership.forEach(comment => {
        commentMap.set(comment.id, comment)
    })

    // Second pass: build tree structure
    commentsWithOwnership.forEach(comment => {
        if (comment.parent_comment_id) {
            // This is a reply
            const parent = commentMap.get(comment.parent_comment_id)
            if (parent) {
                if (!parent.replies) {
                    parent.replies = []
                }
                parent.replies.push(comment)
                parent.replyCount = (parent.replyCount || 0) + 1
            }
        } else {
            // This is a top-level comment
            topLevelComments.push(comment)
        }
    })

    // Sort top-level comments by created_at (newest first)
    topLevelComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Sort replies within each comment (oldest first for better readability)
    const sortReplies = (comment: CommentWithReplies) => {
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            comment.replies.forEach(reply => sortReplies(reply))
        }
    }
    topLevelComments.forEach(comment => sortReplies(comment))

    // Apply limit to top-level comments only
    return topLevelComments.slice(0, limit)
}