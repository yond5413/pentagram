'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toggleFollow } from '@/app/profile/actions'
import { useState } from 'react'
import { User } from '@supabase/supabase-js'

interface ProfileHeaderProps {
    profile: {
        id: string
        username: string
        avatar_url: string | null
        bio?: string | null
        display_name?: string | null
        images?: Array<unknown>
        postsCount?: number
        followers?: Array<{ count: number }>
        following?: Array<{ count: number }>
    }
    currentUser: User | null
    isFollowing: boolean
}

export function ProfileHeader({ profile, currentUser, isFollowing }: ProfileHeaderProps) {
    const [following, setFollowing] = useState(isFollowing)
    const [followerCount, setFollowerCount] = useState<number>(profile.followers?.[0]?.count || 0)

    const isOwnProfile = currentUser?.id === profile.id

    const handleFollow = async () => {
        if (!currentUser) return // Redirect to login ideally

        setFollowing(!following)
        setFollowerCount(prev => following ? prev - 1 : prev + 1)

        try {
            await toggleFollow(profile.id)
        } catch {
            setFollowing(!following)
            setFollowerCount(prev => following ? prev + 1 : prev - 1)
        }
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">{profile.username}</h1>
                    {currentUser && !isOwnProfile && (
                        <Button onClick={handleFollow} variant={following ? "secondary" : "default"}>
                            {following ? "Unfollow" : "Follow"}
                        </Button>
                    )}
                    {isOwnProfile && (
                        <Button variant="outline" size="sm">Edit Profile</Button>
                    )}
                </div>
                <div className="flex gap-6 text-sm">
                    <div className="flex gap-1">
                        <span className="font-bold">{profile.postsCount ?? profile.images?.length ?? 0}</span> posts
                    </div>
                    <div className="flex gap-1">
                        <span className="font-bold">{followerCount}</span> followers
                    </div>
                    <div className="flex gap-1">
                        <span className="font-bold">{profile.following?.[0]?.count || 0}</span> following
                    </div>
                </div>
                {profile.bio && <p className="text-sm max-w-md text-center md:text-left">{profile.bio}</p>}
                {profile.display_name && <p className="text-muted-foreground text-sm">{profile.display_name}</p>}
            </div>
        </div>
    )
}