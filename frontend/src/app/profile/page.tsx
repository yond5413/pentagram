import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileIndex() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch username
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()

    if (profile?.username) {
        redirect(`/profile/${profile.username}`)
    } else {
        // Should not happen if auth flow requires username
        return <div>Profile not found</div>
    }
}
