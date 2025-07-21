import { useState } from "react";
import { MobileContainer } from "@/components/mobile/MobileContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { CommunityFeatures } from "@/components/social/CommunityFeatures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, MessageCircle, Star } from "lucide-react";

const Community = () => {
  const [leaderboard] = useState([
    { rank: 1, name: "Alex Chen", points: 2847, streak: 42 },
    { rank: 2, name: "Sarah Kim", points: 2634, streak: 38 },
    { rank: 3, name: "Mike Johnson", points: 2421, streak: 31 },
    { rank: 4, name: "You", points: 2156, streak: 28 },
    { rank: 5, name: "Emma Davis", points: 1998, streak: 25 }
  ]);

  const [successStories] = useState([
    {
      id: 1,
      author: "Jessica M.",
      story: "Lost 30lbs and built a consistent morning routine that changed my life!",
      likes: 127,
      category: "Fitness"
    },
    {
      id: 2, 
      author: "David K.",
      story: "90 days of meditation helped me manage anxiety and improve focus at work.",
      likes: 89,
      category: "Mental Health"
    }
  ]);

  return (
    <MobileContainer>
      <MobileHeader 
        title="Community" 
        subtitle="Connect and grow together"
      />
      
      <div className="flex-1 overflow-auto px-4 pb-20">
        <Tabs defaultValue="challenges" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaders</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-4">
            <CommunityFeatures />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Weekly Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div key={user.rank} className={`flex items-center justify-between p-3 rounded-lg ${
                      user.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.rank}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.streak} day streak</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.points} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Success Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {successStories.map((story) => (
                    <div key={story.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{story.author}</h4>
                          <Badge variant="outline" className="text-xs">
                            {story.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-4 h-4" />
                          {story.likes}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {story.story}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Support Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Morning Routines", members: 1247, category: "Productivity" },
                    { name: "Meditation Circle", members: 892, category: "Mindfulness" },
                    { name: "Fitness Motivation", members: 2156, category: "Health" },
                    { name: "Digital Wellness", members: 534, category: "Lifestyle" }
                  ].map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {group.members} members • {group.category}
                        </p>
                      </div>
                      <Badge variant="outline">Join</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileContainer>
  );
};

export default Community;