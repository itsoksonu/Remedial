"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Icons } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsService } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => analyticsService.getDashboardMetrics(),
  });

  const { data: denialTrends, error: trendsError } = useQuery({
    queryKey: ["denialTrends"],
    queryFn: () => analyticsService.getDenialTrends("monthly"),
  });

  // Show error toast if queries fail
  useEffect(() => {
    if (metricsError || trendsError) {
      toast.error(
        "Failed to load dashboard data. Please try logging in again.",
      );
    }
  }, [metricsError, trendsError]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div>Error loading dashboard data.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your denial management metrics and activity"
        actions={
          <Button>
            <Icons.download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Claims"
          value={metrics.totalClaims.toLocaleString()}
          icon={Icons.claims}
          description="Processed this month"
        />
        <StatsCard
          title="Denied Claims"
          value={metrics.deniedClaims.toLocaleString()}
          icon={Icons.denials}
          description={`${metrics.denialRate}% Denial Rate`}
        />
        <StatsCard
          title="Total Denial Amount"
          value={`$${metrics.totalDenialAmount.toLocaleString()}`}
          icon={Icons.billing}
          description="Total value of denied claims"
        />
        <StatsCard
          title="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          icon={Icons.activity}
          description={`$${metrics.recoveredAmount.toLocaleString()} Recovered`}
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Denials */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Denial Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {denialTrends && denialTrends.topDenials ? (
                denialTrends.topDenials.slice(0, 5).map((denial: any) => (
                  <div
                    key={denial.code}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {denial.code}
                        </Badge>
                        <span className="font-medium">
                          {denial.description}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {denial.recommendedAction || "Review claim details"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">{denial.count}</div>
                      <p className="text-xs text-muted-foreground">
                        ${denial.totalAmount?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No denial data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="rounded-full p-2 bg-destructive/10 mr-3">
                  <Icons.denials className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Claim #CLM-2024-12345 Denied
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Denial Code: CO-45
                  </p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
                <div className="font-medium text-destructive text-sm">
                  -$250.00
                </div>
              </div>

              <div className="flex items-start">
                <div className="rounded-full p-2 bg-green-500/10 mr-3">
                  <Icons.activity className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Claim #CLM-2024-67890 Recovered
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Appeal successful
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <div className="font-medium text-green-600 text-sm">
                  +$1,200.00
                </div>
              </div>

              <div className="flex items-start">
                <div className="rounded-full p-2 bg-blue-500/10 mr-3">
                  <Icons.appeals className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Appeal Letter Generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For claim #CLM-2024-54321
                  </p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="rounded-full p-2 bg-purple-500/10 mr-3">
                  <Icons.users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    User Assigned to Claim
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sarah Johnson → CLM-2024-11111
                  </p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Icons.upload className="h-5 w-5" />
              <span>Upload Claims CSV</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Icons.appeals className="h-5 w-5" />
              <span>Generate Appeal</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Icons.activity className="h-5 w-5" />
              <span>Run Denial Advisor</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Icons.download className="h-5 w-5" />
              <span>Export Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
