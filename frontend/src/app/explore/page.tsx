import { getTrendingImages } from './actions'
import { ExploreGrid } from './explore-grid'
import { TimePeriodSelector } from './time-period-selector'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const timePeriod = (params.period as 'today' | 'week' | 'month' | 'all') || 'week'
  
  const images = await getTrendingImages(timePeriod)

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Explore</h1>
          <p className="text-muted-foreground mt-1">
            Discover trending AI-generated images
          </p>
        </div>
        <TimePeriodSelector currentPeriod={timePeriod} />
      </div>

      {images.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          No trending images found. Go create some!
        </div>
      ) : (
        <ExploreGrid images={images} />
      )}
    </div>
  )
}

