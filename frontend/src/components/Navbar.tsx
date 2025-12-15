import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { UserNav } from './user-nav'

export default async function Navbar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="hidden font-bold sm:inline-block">
                        Pentagram
                    </span>
                </Link>
                <div className="mr-4 hidden md:flex">
                    <Link href="/feed" className="text-sm font-medium transition-colors hover:text-primary">
                        Feed
                    </Link>
                    <Link href="/explore" className="ml-6 text-sm font-medium transition-colors hover:text-primary">
                        Explore
                    </Link>
                    <Link href="/generate" className="ml-6 text-sm font-medium transition-colors hover:text-primary">
                        Generate
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <UserNav user={user} />
                </div>
            </div>
        </nav>
    )
}
