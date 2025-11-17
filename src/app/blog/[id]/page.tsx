'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const posts = {
  '7': { title: '5 TikTok Trends That Will Dominate 2025', author: 'Content Team' },
  '8': { title: 'The Rise of Short-Form Content', author: 'Marketing Team' },
  '9': { title: 'Sarah\'s Gaming Success Story', author: 'Community Team' },
  '10': { title: 'Psychology Behind Viral Videos', author: 'Research Team' },
  '12': { title: 'Behind the Scenes at Video Clipper Pro', author: 'Team Nova' }
}

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = posts[params.id as keyof typeof posts]

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <Link href="/blog">
            <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/blog" className="inline-flex items-center text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Blog
        </Link>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
          <h1 className="text-4xl font-bold text-white mb-4">{post.title}</h1>
          <p className="text-gray-300 mb-6">By {post.author}</p>
          <p className="text-gray-200">This is the blog post content.</p>
        </Card>
        
        <div className="mt-8 text-center">
          <Link href="/process">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}