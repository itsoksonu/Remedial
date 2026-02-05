"use client";

import { useQuery } from "@tanstack/react-query";
import { Icons } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsService } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => analyticsService.getDashboardMetrics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      </div>
    );
  }

  // Fallback if data fails to load or is empty
  if (!metrics) {
    return <div>Error loading dashboard data.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Icons.claims className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              Processed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied Claims</CardTitle>
            <Icons.denials className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deniedClaims}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.denialRate}% Denial Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Denial Amount
            </CardTitle>
            <Icons.billing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalDenialAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value of denied claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Icons.activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              ${metrics.recoveredAmount.toLocaleString()} Recovered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section Placeholder - Can be expanded with Recharts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Denial Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart Component Here
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Claim #12345 Denied
                  </p>
                  <p className="text-sm text-muted-foreground">Just now</p>
                </div>
                <div className="ml-auto font-medium text-destructive">
                  -$250.00
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Claim #67890 Recovered
                  </p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <div className="ml-auto font-medium text-green-500">
                  +$1,200.00
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
