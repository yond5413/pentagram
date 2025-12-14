import { createClient } from '@/utils/supabase/server'
import { PostCard } from '@/components/post-card'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch public images with profile info
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
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Feed error:", error)
        return <div className="p-8 text-center text-red-500">Error loading feed.</div>
    }

    if (!images || images.length === 0) {
        return (
            <div className="container max-w-xl py-8">
                <div className="text-center text-muted-foreground py-20">
                    No images generated yet. Go create some!
                </div>
            </div>
        )
    }

    // Fetch like counts for all images
    const imageIds = images.map(img => img.id)

    // Get like counts using aggregation
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

    // Attach counts and liked status to images
    const imagesWithCounts = images.map(image => ({
        ...image,
        likesCount: likesCountMap.get(image.id) || 0,
        commentsCount: commentsCountMap.get(image.id) || 0,
        userHasLiked: userLikedImages.has(image.id),
    }))

    return (
        <div className="container max-w-xl py-8 space-y-8">
            {imagesWithCounts.map((image: any) => (
                <PostCard key={image.id} image={image} />
            ))}
        </div>
    )
}
