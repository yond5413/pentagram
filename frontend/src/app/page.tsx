import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/feed');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-2 bg-background text-foreground">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Pentagram</span>
        </h1>

        <p className="mt-3 text-xl sm:text-2xl text-muted-foreground max-w-lg mx-auto">
          The social platform designed for the AI generation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link href="/login">
             <Button size="lg" className="w-full sm:w-auto">Login</Button>
          </Link>

          <Link href="/signup">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Sign Up</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
