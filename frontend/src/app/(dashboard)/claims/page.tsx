"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { claimsService } from "@/services/claims.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function ClaimsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ["claims", statusFilter, priorityFilter],
    queryFn: () =>
      claimsService.getClaims({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
  });

  const claims = claimsData?.data || [];

  // Filter claims locally by search query
  const filteredClaims = claims.filter((claim: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      claim.claimNumber?.toLowerCase().includes(search) ||
      claim.patient?.firstName?.toLowerCase().includes(search) ||
      claim.patient?.lastName?.toLowerCase().includes(search) ||
      claim.payer?.name?.toLowerCase().includes(search)
    );
  });

  // Calculate summary stats
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(
    (c: any) => c.status === "pending",
  ).length;
  const deniedClaims = claims.filter(
    (c: any) => c.status === "denied" || c.status === "rejected",
  ).length;
  const resolvedClaims = claims.filter(
    (c: any) => c.status === "paid" || c.status === "resolved",
  ).length;

  if (isLoading) {
    return <div>Loading claims...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Management"
        description="View and manage all claims"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline">
              <Icons.upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button variant="outline">
              <Icons.download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button>
              <Icons.add className="mr-2 h-4 w-4" /> New Claim
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Icons.claims className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Icons.activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <Icons.denials className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Icons.activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedClaims}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Search by claim #, patient, or payer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="appealed">Appealed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter || priorityFilter || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={filteredClaims} />
        </CardContent>
      </Card>
    </div>
  );
}
