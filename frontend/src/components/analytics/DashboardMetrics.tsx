'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, icon, description }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {isPositive && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
            <span className={isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : ''}>
              {change > 0 ? '+' : ''}{formatPercentage(change)}
            </span>
            <span className="ml-1">from last month</span>
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  data: {
    totalClaims: number;
    deniedClaims: number;
    denialRate: number;
    totalDenialAmount: number;
    recoveredAmount: number;
    recoveryRate: number;
    avgDaysToResolve: number;
    trends: {
      denialRate: { current: number; previous: number; change: number };
      recoveryRate: { current: number; previous: number; change: number };
    };
  };
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Claims"
        value={data.totalClaims.toLocaleString()}
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Denied Claims"
        value={data.deniedClaims.toLocaleString()}
        change={data.trends.denialRate.change}
        icon={<AlertCircle className="h-4 w-4 text-destructive" />}
        description={`${formatPercentage(data.denialRate)} denial rate`}
      />
      <MetricCard
        title="Total Denied Amount"
        value={formatCurrency(data.totalDenialAmount)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Recovered Amount"
        value={formatCurrency(data.recoveredAmount)}
        change={data.trends.recoveryRate.change}
        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        description={`${formatPercentage(data.recoveryRate)} recovery rate`}
      />
    </div>
  );
}