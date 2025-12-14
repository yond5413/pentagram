'use server'

import { createClient } from '@/utils/supabase/server'

function getAspectRatioDimensions(aspectRatio: string): { width: number; height: number } {
  const baseSize = 512
  switch (aspectRatio) {
    case '16:9':
      return { width: 768, height: 432 }
    case '9:16':
      return { width: 432, height: 768 }
    case '1:1':
    default:
      return { width: baseSize, height: baseSize }
  }
}

export async function generateImage(
  prevState: { error?: string; success?: boolean; imageId?: string } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please log in to generate images' }
  }

  const prompt = formData.get('prompt') as string
  const negativePrompt = formData.get('negative_prompt') as string
  const aspectRatio = formData.get('aspect_ratio') as string || '1:1'
  const steps = parseInt(formData.get('steps') as string || '30')
  const guidanceScale = parseFloat(formData.get('guidance_scale') as string || '7.5')

  if (!prompt) {
    return { error: 'Prompt is required' }
  }

  try {
    // Construct the API URL - use environment variable or default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/generate-image`
    
    // Call the API route to generate the image
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt || undefined,
        aspect_ratio: aspectRatio,
        steps,
        guidance_scale: guidanceScale,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to generate image'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch {
          // Use default error message
        }
      }
      return { error: errorMessage }
    }

    const data = await response.json()
    
    if (!data.success || !data.imageUrl) {
      return { error: data.error || 'Image generation failed' }
    }

    // Calculate dimensions based on aspect ratio
    const { width, height } = getAspectRatioDimensions(aspectRatio)

    // Save to Supabase
    const { data: insertedImage, error } = await supabase.from('images').insert({
      user_id: user.id,
      prompt,
      negative_prompt: negativePrompt || null,
      model_name: 'stable-diffusion-xl',
      steps,
      guidance_scale: guidanceScale,
      image_url: data.imageUrl,
      width,
      height,
      is_public: true
    }).select('id').single()

    if (error || !insertedImage) {
      console.error('Error inserting image:', error)
      return { error: 'Failed to save image' }
    }

    return { success: true, imageId: insertedImage.id }
  } catch (error) {
    console.error('Error generating image:', error)
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
