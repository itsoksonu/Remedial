"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { claimsService } from "@/services/claims.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

export default function ClaimsPage() {
  const { data: claimsData, isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: () => claimsService.getClaims(),
  });

  // Backend likely returns { success: true, data: { items: [], meta: {} } } or just { success: true, data: [] }
  // ClaimsController.getClaims uses findAll which likely returns an array or paginated object.
  // Assuming it returns the array directly in data property of response based on my service implementation 'return response.data'.
  // Actually, ClaimsService.findAll usually returns an array.
  // But wait, my claimsService.getClaims returns response.data.
  // And the controller returns { success: true, data: result }.
  // So 'claimsData' here will be { success: true, data: [...] }.
  // I need to access claimsData.data.

  const claims = claimsData?.data || [];

  if (isLoading) {
    return <div>Loading claims...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Claims</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Icons.download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button>
            <Icons.add className="mr-2 h-4 w-4" /> New Claim
          </Button>
        </div>
      </div>
      <div>
        <DataTable columns={columns} data={claims} searchKey="claimNumber" />
      </div>
    </div>
  );
}
