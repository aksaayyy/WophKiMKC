import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, MessageSquare, Trophy, Star, ExternalLink, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Community() {
  const communityStats = [
    { label: "Active Creators", value: "25,000+", icon: <Users className="w-6 h-6" /> },
    { label: "Videos Processed", value: "1M+", icon: <Trophy className="w-6 h-6" /> },
    { label: "Community Posts", value: "50,000+", icon: <MessageSquare className="w-6 h-6" /> },
    { label: "Success Stories", value: "500+", icon: <Star className="w-6 h-6" /> }
  ]

  const communityChannels = [
    {
      name: "Discord Server",
      description: "Join our active Discord community for real-time discussions, tips, and support",
      members: "15,000+ members",
      link: "#",
      icon: "💬"
    },
    {
      name: "Reddit Community",
      description: "Share your creations, get feedback, and discover new techniques",
      members: "8,000+ members", 
      link: "#",
      icon: "🔥"
    },
    {
      name: "YouTube Channel",
      description: "Tutorials, creator spotlights, and the latest Video Clipper Pro updates",
      members: "25,000+ subscribers",
      link: "#",
      icon: "📺"
    },
    {
      name: "Twitter Community",
      description: "Quick tips, announcements, and connect with fellow creators",
      members: "12,000+ followers",
      link: "#",
      icon: "🐦"
    }
  ]

  const featuredCreators = [
    {
      name: "Sarah Chen",
      handle: "@sarahgames",
      achievement: "0 to 100K followers in 8 months",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
      story: "Gaming content creator who transformed her Twitch streams into viral TikTok clips"
    },
    {
      name: "Marcus Rodriguez",
      handle: "@fitnesswithmarc",
      achievement: "2M+ total views",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      story: "Fitness coach creating bite-sized workout content from long-form training videos"
    },
    {
      name: "Emma Thompson",
      handle: "@cookingemma",
      achievement: "500K+ followers across platforms",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      story: "Food blogger turning cooking tutorials into engaging recipe shorts"
    }
  ]

  const upcomingEvents = [
    {
      title: "Creator Spotlight: Gaming Content",
      date: "Jan 25, 2025",
      time: "2:00 PM PST",
      type: "Live Stream"
    },
    {
      title: "Q&A with Video Clipper Pro Team",
      date: "Feb 1, 2025", 
      time: "1:00 PM PST",
      type: "AMA Session"
    },
    {
      title: "Content Creation Workshop",
      date: "Feb 8, 2025",
      time: "3:00 PM PST", 
      type: "Workshop"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join Our Creator Community
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Connect with thousands of content creators, share your success stories, get feedback, and learn from the best in the industry.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {communityStats.map((stat, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <div className="text-purple-400 mb-3 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-300 text-sm">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Community Channels */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Where to Find Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {communityChannels.map((channel, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 hover:bg-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{channel.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{channel.name}</h3>
                    <p className="text-gray-300 mb-3">{channel.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 text-sm">{channel.members}</span>
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        Join <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Creators */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Creators</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCreators.map((creator, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={creator.avatar} 
                    alt={creator.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{creator.name}</h3>
                    <p className="text-purple-300">{creator.handle}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="px-3 py-1 bg-purple-600/50 text-white text-sm rounded-full">
                    {creator.achievement}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{creator.story}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Upcoming Events</h2>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <div className="space-y-6">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-6 h-6 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <p className="text-gray-300">{event.date} at {event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-600/50 text-white text-sm rounded-full">
                      {event.type}
                    </span>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      Join Event
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Community Guidelines */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Community Guidelines</h2>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">✅ Do</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Share your success stories and learnings</li>
                  <li>• Help other creators with constructive feedback</li>
                  <li>• Ask questions and seek advice</li>
                  <li>• Celebrate others' achievements</li>
                  <li>• Share valuable resources and tips</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">❌ Don't</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Spam or self-promote excessively</li>
                  <li>• Share inappropriate or offensive content</li>
                  <li>• Engage in harassment or bullying</li>
                  <li>• Share copyrighted content without permission</li>
                  <li>• Spread misinformation or false claims</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Join CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-white/20 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Join Our Community?</h3>
            <p className="text-gray-300 mb-6">
              Start connecting with fellow creators today and take your content to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3">
                Join Discord
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3">
                Follow on Twitter
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}