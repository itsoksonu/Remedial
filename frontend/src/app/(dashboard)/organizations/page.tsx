"use client";

import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizations.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrganizationPage() {
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: () => organizationService.getOrganization(),
  });

  const org = orgData?.data;

  if (isLoading) return <div>Loading organization...</div>;

  if (!org) return <div>No organization found.</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Organization Profile
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{org.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={org.isActive ? "success" : "destructive"}>
              {org.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-sm">{org.id}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Tax ID</span>
            <span>{org.taxId || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant="secondary" className="uppercase">
              {org.subscriptionTier}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
