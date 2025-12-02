import { useState } from 'react';
import { MobileContainer } from '@/components/mobile/MobileContainer';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGuidedJourneys } from '@/hooks/useGuidedJourneys';
import {
  BookOpen,
  Clock,
  Trophy,
  Lock,
  Play,
  CheckCircle2,
  Crown,
  Users
} from 'lucide-react';

const Journeys = () => {
  const {
    journeys,
    enrollments,
    loading,
    enrollInJourney,
    isEnrolled,
    getEnrollmentForJourney
  } = useGuidedJourneys();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'fitness', 'mindfulness', 'productivity', 'nutrition', 'relationships'];

  const filteredJourneys = selectedCategory === 'all'
    ? journeys
    : journeys.filter(j => j.category === selectedCategory);

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <MobileHeader title="Guided Journeys" subtitle="Structured paths to growth" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading journeys...</p>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <MobileHeader
        title="Guided Journeys"
        subtitle="Structured paths to growth"
      />

      <div className="flex-1 overflow-auto px-4 pb-20">
        <Tabs defaultValue="explore" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedEnrollments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredJourneys.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No journeys found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try selecting a different category
                    </p>
                  </div>
                </Card>
              ) : (
                filteredJourneys.map(journey => {
                  const enrolled = isEnrolled(journey.id);
                  const enrollment = getEnrollmentForJourney(journey.id);

                  return (
                    <Card key={journey.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{journey.title}</CardTitle>
                              {journey.is_premium && (
                                <Crown className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <CardDescription>{journey.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className={getDifficultyColor(journey.difficulty_level)}>
                            {journey.difficulty_level}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {journey.estimated_duration_days} days
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {journey.total_steps} steps
                          </Badge>
                          {journey.coach_led && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Coach-led
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {enrolled && enrollment ? (
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{enrollment.completion_percentage}%</span>
                              </div>
                              <Progress value={enrollment.completion_percentage} />
                            </div>
                            <Button className="w-full" variant="default">
                              <Play className="w-4 h-4 mr-2" />
                              Continue Journey
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => enrollInJourney(journey.id)}
                          >
                            {journey.is_premium ? (
                              <>
                                <Crown className="w-4 h-4 mr-2" />
                                Enroll (Premium)
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Journey
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeEnrollments.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No active journeys</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new journey to begin your growth path
                  </p>
                  <Button onClick={() => document.querySelector('[value="explore"]')?.click()}>
                    Explore Journeys
                  </Button>
                </div>
              </Card>
            ) : (
              activeEnrollments.map(enrollment => {
                const journey = journeys.find(j => j.id === enrollment.journey_id);
                if (!journey) return null;

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{journey.title}</CardTitle>
                      <CardDescription>
                        Started {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {enrollment.completed_steps} of {journey.total_steps} steps
                          </span>
                          <span className="font-medium">{enrollment.completion_percentage}%</span>
                        </div>
                        <Progress value={enrollment.completion_percentage} />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                        <Button variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedEnrollments.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No completed journeys yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your first journey to earn achievements
                  </p>
                </div>
              </Card>
            ) : (
              completedEnrollments.map(enrollment => {
                const journey = journeys.find(j => j.id === enrollment.journey_id);
                if (!journey) return null;

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {journey.title}
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </CardTitle>
                          <CardDescription>
                            Completed {new Date(enrollment.completed_at!).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">
                          {journey.total_steps} steps completed
                        </span>
                        <Badge variant="outline" className="bg-green-50">
                          <Trophy className="w-3 h-3 mr-1" />
                          100%
                        </Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        View Certificate
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileContainer>
  );
};

export default Journeys;
