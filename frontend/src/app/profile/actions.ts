'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    if (user.id === targetUserId) {
        throw new Error("Cannot follow self")
    }

    // Check if following
    const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()

    if (existingFollow) {
        // Unfollow
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
        
        if (error) {
            throw new Error('Failed to unfollow')
        }
    } else {
        // Follow
        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: targetUserId
            })
        
        if (error) {
            throw new Error('Failed to follow')
        }
    }

    revalidatePath(`/profile`)
    revalidatePath(`/profile/[username]`, 'page')
    revalidatePath(`/feed`)
}

export async function getProfile(username: string) {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            *,
            images:images!user_id(*)
        `)
        .eq('username', username)
        .single()

    if (error || !profile) return null

    // Filter out deleted images for all profiles (including own profile)
    const { data: { user } } = await supabase.auth.getUser()
    const isOwnProfile = user?.id === profile.id
    
    // Always filter deleted images for accurate post count
    if (profile.images) {
        profile.images = profile.images.filter((img: { is_deleted?: boolean }) => !img.is_deleted)
    }

    // Calculate accurate post count excluding deleted posts
    const postsCount = profile.images ? profile.images.length : 0

    // Get accurate follower and following counts
    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id)

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id)

    return {
        ...profile,
        postsCount,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
    }
}
