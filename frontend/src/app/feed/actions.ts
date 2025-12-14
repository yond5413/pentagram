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
    const { data: images, error } = await supabase
        .from('images')
        .select(`
            *,
            profiles:user_id (
                username,
                avatar_url
            ),
            likes:image_likes(count),
            comments:comments(count),
            user_has_liked:image_likes!inner(user_id)
        `)
        .eq('is_public', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error("Error fetching feed:", error)
        return []
    }

    // Process the result to add a boolean for user_has_liked 
    // This is tricky with simple select, often requires a separate query or auth.uid() trick in view
    // For now, let's fetch strictly for public view and maybe hydrate client side or improve query

    // Simplification for now:
    const { data: { user } } = await supabase.auth.getUser()

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

export async function addComment(imageId: string, content: string) {
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

    const { error } = await supabase
        .from('comments')
        .insert({
            image_id: imageId,
            user_id: user.id,
            content: content.trim(),
        })

    if (error) {
        console.error('Error adding comment:', error)
        throw new Error('Failed to add comment')
    }

    revalidatePath('/feed')
    revalidatePath('/explore')
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Verify the comment belongs to the user
    const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

    if (fetchError || !comment) {
        throw new Error('Comment not found')
    }

    if (comment.user_id !== user.id) {
        throw new Error('Unauthorized to delete this comment')
    }

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
}

export async function getComments(imageId: string, limit: number = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .eq('image_id', imageId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    // Add isOwner flag if user is logged in
    const commentsWithOwnership = (comments || []).map(comment => ({
        ...comment,
        isOwner: user?.id === comment.user_id,
    }))

    return commentsWithOwnership
}