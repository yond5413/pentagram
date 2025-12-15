'use server'

import { createClient } from '@/utils/supabase/server'

export interface ExploreImage {
  id: string
  image_url: string
  prompt: string
  created_at: string
  likesCount: number
  commentsCount: number
  trendingScore: number
  userHasLiked: boolean
  profiles: {
    username: string
    avatar_url: string | null
  } | null
}

export async function getTrendingImages(timePeriod: 'today' | 'week' | 'month' | 'all' = 'week'): Promise<ExploreImage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Calculate time filter
  let timeFilter = new Date()
  switch (timePeriod) {
    case 'today':
      timeFilter.setHours(0, 0, 0, 0)
      break
    case 'week':
      timeFilter.setDate(timeFilter.getDate() - 7)
      break
    case 'month':
      timeFilter.setMonth(timeFilter.getMonth() - 1)
      break
    case 'all':
      timeFilter = new Date(0) // Beginning of time
      break
  }

  // First, get all public images with their engagement metrics
  // We'll use a subquery to calculate trending scores
  const { data: images, error } = await supabase
    .from('images')
    .select(`
      id,
      image_url,
      prompt,
      created_at,
      profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .eq('is_deleted', false)
    .gte('created_at', timeFilter.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching images:', error)
    return []
  }

  if (!images || images.length === 0) {
    return []
  }

  // Fetch like and comment counts for all images
  const imageIds = images.map(img => img.id)

  // Get like counts
  const { data: likesData } = await supabase
    .from('image_likes')
    .select('image_id')
    .in('image_id', imageIds)

  // Get comment counts
  const { data: commentsData } = await supabase
    .from('comments')
    .select('image_id')
    .in('image_id', imageIds)

  // Count likes and comments per image
  const likesCountMap = new Map<string, number>()
  const commentsCountMap = new Map<string, number>()

  likesData?.forEach(like => {
    likesCountMap.set(like.image_id, (likesCountMap.get(like.image_id) || 0) + 1)
  })

  commentsData?.forEach(comment => {
    commentsCountMap.set(comment.image_id, (commentsCountMap.get(comment.image_id) || 0) + 1)
  })

  // Get user's liked images if logged in
  const userLikedImages = new Set<string>()
  if (user) {
    const { data: userLikes } = await supabase
      .from('image_likes')
      .select('image_id')
      .eq('user_id', user.id)
      .in('image_id', imageIds)

    userLikes?.forEach(like => {
      userLikedImages.add(like.image_id)
    })
  }

  // Calculate trending score and attach counts
  const now = Date.now()
  const imagesWithScores: ExploreImage[] = images.map(image => {
    const likesCount = likesCountMap.get(image.id) || 0
    const commentsCount = commentsCountMap.get(image.id) || 0
    const createdAt = new Date(image.created_at).getTime()
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60)
    
    // Trending score: (likes * 1.0 + comments * 2.0) / (hours + 1)
    // This gives more weight to recent content and comments
    const trendingScore = (likesCount * 1.0 + commentsCount * 2.0) / (hoursSinceCreation + 1)

    // Transform profiles from array to single object or null
    let profile: { username: string; avatar_url: string | null } | null = null
    if (image.profiles) {
      if (Array.isArray(image.profiles) && image.profiles.length > 0) {
        profile = {
          username: image.profiles[0].username,
          avatar_url: image.profiles[0].avatar_url,
        }
      } else if (!Array.isArray(image.profiles)) {
        const profileData = image.profiles as { username: string; avatar_url: string | null }
        profile = {
          username: profileData.username,
          avatar_url: profileData.avatar_url,
        }
      }
    }

    return {
      id: image.id,
      image_url: image.image_url,
      prompt: image.prompt,
      created_at: image.created_at,
      likesCount,
      commentsCount,
      trendingScore,
      userHasLiked: userLikedImages.has(image.id),
      profiles: profile,
    }
  })

  // Sort by trending score (highest first)
  imagesWithScores.sort((a, b) => b.trendingScore - a.trendingScore)

  return imagesWithScores
}

