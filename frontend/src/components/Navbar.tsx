import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center max-w-screen-2xl">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="font-bold sm:inline-block">Pentagram</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <Button variant="ghost" asChild>
                        <Link href="https://github.com/yond5413/pentagram" target="_blank">
                            GitHub
                        </Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
