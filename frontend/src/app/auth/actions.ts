'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return redirect(`/login?error=${encodeURIComponent('Email and password are required')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    // Step 2: Input Validation
    if (!email || !password || !username) {
        return redirect(`/signup?error=${encodeURIComponent('All fields are required')}`)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return redirect(`/signup?error=${encodeURIComponent('Invalid email format')}`)
    }

    // Validate password length
    if (password.length < 6) {
        return redirect(`/signup?error=${encodeURIComponent('Password must be at least 6 characters')}`)
    }

    // Validate username format (alphanumeric, underscores, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
        return redirect(`/signup?error=${encodeURIComponent('Username must be 3-20 characters and contain only letters, numbers, and underscores')}`)
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
            }
        }
    })

    if (authError) {
        // Step 3: Properly encode error messages
        return redirect(`/signup?error=${encodeURIComponent(authError.message)}`)
    }

    // Step 1: Ensure profile exists after successful auth signup
    // Note: A database trigger automatically creates the profile, but we check/update it here as a fallback
    if (authData.user) {
        // Check if profile already exists (created by trigger)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', authData.user.id)
            .single()

        if (!existingProfile) {
            // Profile doesn't exist, create it (fallback if trigger didn't run)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    username: username.trim(),
                })

            if (profileError) {
                // Check if it's a duplicate username error
                if (profileError.code === '23505') { // Unique violation
                    return redirect(`/signup?error=${encodeURIComponent('Username already taken')}`)
                }
                // For other errors, log and show generic message
                console.error('Profile creation error:', profileError)
                return redirect(`/signup?error=${encodeURIComponent('Failed to create profile. Please try again.')}`)
            }
        } else if (existingProfile.username !== username.trim()) {
            // Profile exists but username doesn't match (shouldn't happen, but update it)
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: username.trim() })
                .eq('id', authData.user.id)

            if (updateError) {
                if (updateError.code === '23505') { // Unique violation
                    return redirect(`/signup?error=${encodeURIComponent('Username already taken')}`)
                }
                console.error('Profile update error:', updateError)
            }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check email to continue sign in process')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
