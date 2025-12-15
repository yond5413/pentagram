import { getPostById } from './actions'
import { PostDetail } from './post-detail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const post = await getPostById(params.id)

  if (!post) {
    notFound()
  }

  return <PostDetail post={post} />
}


