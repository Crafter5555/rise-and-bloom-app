import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Trophy, Target, MessageCircle } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysRemaining: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AccountabilityPartner {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  sharedHabits: string[];
  status: 'online' | 'offline';
}

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  achievement?: string;
}

export const CommunityFeatures = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<'challenges' | 'partners' | 'feed'>('challenges');

  useEffect(() => {
    // Mock community data
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: '30-Day Morning Routine',
        description: 'Start every day with a consistent morning routine',
        participants: 2847,
        daysRemaining: 12,
        category: 'Habits',
        difficulty: 'medium'
      },
      {
        id: '2',
        title: 'Meditation Marathon',
        description: '10 minutes of daily meditation for 21 days',
        participants: 1534,
        daysRemaining: 8,
        category: 'Mindfulness',
        difficulty: 'easy'
      },
      {
        id: '3',
        title: 'Digital Detox Weekend',
        description: 'Reduce screen time by 50% every weekend',
        participants: 892,
        daysRemaining: 3,
        category: 'Wellbeing',
        difficulty: 'hard'
      }
    ];

    const mockPartners: AccountabilityPartner[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        avatar: '/placeholder.svg',
        streak: 12,
        sharedHabits: ['Exercise', 'Meditation'],
        status: 'online'
      },
      {
        id: '2',
        name: 'Mike Rodriguez',
        avatar: '/placeholder.svg',
        streak: 8,
        sharedHabits: ['Reading', 'Journaling'],
        status: 'offline'
      }
    ];

    setChallenges(mockChallenges);
    setPartners(mockPartners);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community & Accountability
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === 'challenges' ? 'default' : 'outline'}
              onClick={() => setActiveTab('challenges')}
            >
              Challenges
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'partners' ? 'default' : 'outline'}
              onClick={() => setActiveTab('partners')}
            >
              Partners
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {challenge.description}
                      </p>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {challenge.participants.toLocaleString()} joined
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {challenge.daysRemaining} days left
                      </div>
                    </div>
                    <Button size="sm">Join Challenge</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div key={partner.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={partner.avatar} />
                          <AvatarFallback>{partner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          partner.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{partner.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="w-3 h-3" />
                          {partner.streak} day streak
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Shared habits:</p>
                    <div className="flex gap-1">
                      {partner.sharedHabits.map((habit, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {habit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                Find New Partners
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};