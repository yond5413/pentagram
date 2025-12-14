'use client'

import { useFormStatus, useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { generateImage } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate'
      )}
    </Button>
  )
}

export function GenerateForm() {
  const [state, formAction] = useFormState(generateImage, null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      })
    } else if (state?.success && state?.imageId) {
      toast({
        title: 'Success',
        description: 'Image generated successfully!',
      })
      // Redirect to the post detail page
      router.push(`/post/${state.imageId}`)
    }
  }, [state, toast, router])

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          name="prompt"
          placeholder="A futuristic city with flying cars, cyberpunk style..."
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="negative_prompt">Negative Prompt</Label>
        <Input
          id="negative_prompt"
          name="negative_prompt"
          placeholder="blurry, bad quality, distorted..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
        <Select name="aspect_ratio" defaultValue="1:1">
          <SelectTrigger>
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">Square (1:1)</SelectItem>
            <SelectItem value="16:9">Landscape (16:9)</SelectItem>
            <SelectItem value="9:16">Portrait (9:16)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* hidden inputs for default values for now, could be advanced settings */}
      <input type="hidden" name="steps" value="30" />
      <input type="hidden" name="guidance_scale" value="7.5" />

      <SubmitButton />
    </form>
  )
}

