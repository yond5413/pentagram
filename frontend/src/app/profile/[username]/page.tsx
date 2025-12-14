import { createClient } from '@/utils/supabase/server'
import { getProfile } from '../actions'
import { ProfileHeader } from '@/components/profile-header'
import { ProfileGrid } from '@/components/profile-grid'

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const profile = await getProfile(params.username)

    if (!profile) {
        return <div className="p-10 text-center">User not found</div>
    }

    // Check if following
    // Need separate query since we need to know if *current user* follows *profile user*
    let isFollowing = false
    if (user && user.id !== profile.id) {
        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .single()
        isFollowing = !!data
    }

    const isOwnProfile = user?.id === profile.id

    return (
        <div className="container max-w-4xl py-10">
            <ProfileHeader profile={profile} currentUser={user} isFollowing={isFollowing} />

            <ProfileGrid
                images={profile.images || []}
                isOwnProfile={isOwnProfile}
                username={profile.username}
            />
        </div>
    )
}
