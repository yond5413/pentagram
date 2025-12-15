'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExploreImage } from './actions'

interface ExploreGridProps {
  images: ExploreImage[]
}

export function ExploreGrid({ images }: ExploreGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
      {images.map((image) => (
        <Link
          key={image.id}
          href={`/post/${image.id}`}
          className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={image.image_url}
            alt={image.prompt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <Heart
                  className={cn(
                    "h-6 w-6",
                    image.userHasLiked && "fill-current"
                  )}
                />
                <span className="font-semibold">{image.likesCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span className="font-semibold">{image.commentsCount}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

