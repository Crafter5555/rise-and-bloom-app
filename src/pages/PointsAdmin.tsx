import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Users, Shield, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PendingEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_time: string;
  points_delta: number;
  trust_score: number;
  validation_status: string;
  proof_payload: any;
  device_info: any;
  created_at: string;
}

interface FraudInsight {
  id: string;
  user_id: string;
  insight_type: string;
  severity: string;
  score: number;
  details: any;
  resolved: boolean;
  created_at: string;
}

const PointsAdmin = () => {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [fraudInsights, setFraudInsights] = useState<FraudInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalFraud: 0,
    avgTrustScore: 0,
    todayValidated: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    await Promise.all([
      fetchPendingEvents(),
      fetchFraudInsights(),
      fetchStats()
    ]);
  };

  const fetchPendingEvents = async () => {
    const { data, error } = await supabase
      .from('points_events')
      .select('*')
      .in('validation_status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setPendingEvents(data);
    }
  };

  const fetchFraudInsights = async () => {
    const { data, error } = await supabase
      .from('fraud_insights')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setFraudInsights(data);
    }
  };

  const fetchStats = async () => {
    const [pendingCount, fraudCount, trustScore, todayCount] = await Promise.all([
      supabase.from('points_events').select('id', { count: 'exact' }).in('validation_status', ['pending', 'pending_review']),
      supabase.from('fraud_insights').select('id', { count: 'exact' }).eq('resolved', false),
      supabase.from('points_events').select('trust_score').in('validation_status', ['pending', 'pending_review']),
      supabase.from('points_events').select('id', { count: 'exact' }).eq('validation_status', 'validated').gte('validated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const avgScore = trustScore.data && trustScore.data.length > 0
      ? trustScore.data.reduce((sum, e) => sum + (e.trust_score || 0), 0) / trustScore.data.length
      : 0;

    setStats({
      totalPending: pendingCount.count || 0,
      totalFraud: fraudCount.count || 0,
      avgTrustScore: Math.round(avgScore),
      todayValidated: todayCount.count || 0
    });
  };

  const handleValidateEvent = async (eventId: string, approve: boolean) => {
    setLoading(true);

    try {
      if (approve) {
        // Call validation function
        const { error } = await supabase.functions.invoke('validate-points-event', {
          body: { event_id: eventId }
        });

        if (error) throw error;

        toast({
          title: "Event validated",
          description: "Points have been awarded successfully."
        });
      } else {
        // Reject event
        const { error } = await supabase
          .from('points_events')
          .update({
            validation_status: 'rejected',
            validated_by: user?.email || 'admin',
            validated_at: new Date().toISOString(),
            validation_notes: 'Manually rejected by admin'
          })
          .eq('id', eventId);

        if (error) throw error;

        toast({
          title: "Event rejected",
          description: "The event has been marked as rejected."
        });
      }

      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFraud = async (insightId: string, resolved: boolean) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('fraud_insights')
        .update({
          resolved: resolved,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.email || 'admin',
          resolution_notes: resolved ? 'Marked as false positive' : 'Confirmed fraud'
        })
        .eq('id', insightId);

      if (error) throw error;

      toast({
        title: "Insight resolved",
        description: "The fraud insight has been updated."
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 60) return 'text-green-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Points System Administration
        </h1>
        <p className="text-base text-muted-foreground">Manual review and fraud detection</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fraud Alerts</p>
                <p className="text-2xl font-bold">{stats.totalFraud}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Trust Score</p>
                <p className={`text-2xl font-bold ${getTrustScoreColor(stats.avgTrustScore)}`}>
                  {stats.avgTrustScore}/100
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Validated</p>
                <p className="text-2xl font-bold">{stats.todayValidated}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Eye className="w-4 h-4 mr-2" />
            Pending Events ({stats.totalPending})
          </TabsTrigger>
          <TabsTrigger value="fraud">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Fraud Alerts ({stats.totalFraud})
          </TabsTrigger>
        </TabsList>

        {/* Pending Events Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Events Pending Manual Review</CardTitle>
              <CardDescription>
                Events with trust scores between 30-60 require manual approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No pending events
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-xs">
                            {new Date(event.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {event.event_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${getTrustScoreColor(event.trust_score)}`}>
                              {event.trust_score || 0}/100
                            </span>
                          </TableCell>
                          <TableCell>{event.points_delta || 0}</TableCell>
                          <TableCell className="text-xs">
                            {event.device_info?.platform || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleValidateEvent(event.id, true)}
                                disabled={loading}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleValidateEvent(event.id, false)}
                                disabled={loading}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Alerts Tab */}
        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle>Active Fraud Alerts</CardTitle>
              <CardDescription>
                Suspicious patterns and behavior detected by the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudInsights.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No active fraud alerts
                  </p>
                ) : (
                  fraudInsights.map((insight) => (
                    <Card key={insight.id} className="border-l-4 border-l-red-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getSeverityColor(insight.severity)}>
                                {insight.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {insight.insight_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-2">
                              Score: {insight.score}/100
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {JSON.stringify(insight.details, null, 2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Detected: {new Date(insight.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveFraud(insight.id, true)}
                              disabled={loading}
                            >
                              False Positive
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleResolveFraud(insight.id, false)}
                              disabled={loading}
                            >
                              Confirm Fraud
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PointsAdmin;
