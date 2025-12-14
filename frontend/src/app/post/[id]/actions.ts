'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPostById(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the post with user profile
  const { data: post, error } = await supabase
    .from('images')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url,
        display_name
      )
    `)
    .eq('id', postId)
    .single()

  if (error || !post) {
    return null
  }

  // Check if post is deleted or not public (unless user owns it)
  if (post.is_deleted || (!post.is_public && post.user_id !== user?.id)) {
    if (post.user_id !== user?.id) {
      return null // Post not found or not accessible
    }
  }

  // Get like count
  const { count: likesCount } = await supabase
    .from('image_likes')
    .select('*', { count: 'exact', head: true })
    .eq('image_id', postId)

  // Get comment count
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('image_id', postId)

  // Check if current user has liked the post
  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('image_likes')
      .select('*')
      .eq('image_id', postId)
      .eq('user_id', user.id)
      .single()
    
    userHasLiked = !!like
  }

  return {
    ...post,
    likesCount: likesCount || 0,
    commentsCount: commentsCount || 0,
    userHasLiked,
    isOwner: user?.id === post.user_id,
  }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify the post belongs to the user
  const { data: post, error: fetchError } = await supabase
    .from('images')
    .select('user_id, profiles:user_id(username)')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found')
  }

  if (post.user_id !== user.id) {
    throw new Error('Unauthorized to delete this post')
  }

  // Soft delete: set is_deleted = true
  const { error } = await supabase
    .from('images')
    .update({ is_deleted: true })
    .eq('id', postId)

  if (error) {
    console.error('Error deleting post:', error)
    throw new Error('Failed to delete post')
  }

  // Revalidate relevant paths
  revalidatePath('/feed')
  revalidatePath('/explore')
  revalidatePath(`/profile/${(post.profiles as any)?.username}`)
  revalidatePath(`/post/${postId}`)

  // Return redirect path for client-side navigation
  const username = (post.profiles as any)?.username
  return { 
    success: true, 
    redirectTo: username ? `/profile/${username}` : '/feed' 
  }
}

