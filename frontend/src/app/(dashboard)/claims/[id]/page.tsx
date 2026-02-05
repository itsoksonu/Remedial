"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/lib/icons";
import { claimsService } from "@/services/claims.service";
import { aiService } from "@/services/ai.service";

export default function ClaimDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: claimData, isLoading } = useQuery({
    queryKey: ["claim", id],
    queryFn: () => claimsService.getClaimById(id as string),
    enabled: !!id,
  });

  const claim = claimData?.data;

  const analyzeMutation = useMutation({
    mutationFn: () => aiService.analyzeClaim(id as string),
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed the claim.",
        variant: "success",
      });
      // Invalidate query to refresh claim data if AI updates it
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the claim.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading details...</div>;
  }

  if (!claim) {
    return <div>Claim not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Claim #{claim.claimNumber}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{claim.status}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {new Date(claim.dateOfService).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.bot className="mr-2 h-4 w-4" />
            )}
            Analyze w/ AI
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="line-items">Line Items</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">
                    {claim.patient?.firstName} {claim.patient?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-medium">
                    {claim.patientId?.slice(0, 8)}...
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Financials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Charge:</span>
                  <span className="font-medium">
                    ${Number(claim.totalCharge).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-medium">
                    ${Number(claim.paidAmount || 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Automated analysis of denial reasons and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {claim.aiRecommendedAction ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Icons.bot className="h-4 w-4" /> Recommended Action
                    </h4>
                    <p>{claim.aiRecommendedAction}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Confidence Score:
                    </span>
                    <Badge
                      variant={
                        Number(claim.aiConfidenceScore) > 0.8
                          ? "success"
                          : "warning"
                      }
                    >
                      {Number(claim.aiConfidenceScore) * 100}%
                    </Badge>
                  </div>
                  <Button>Generate Appeal Letter</Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analysis available yet. Click "Analyze w/ AI" to start.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appeals">
          <div className="text-center py-8 text-muted-foreground">
            Coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
