"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { appealsService } from "@/services/appeals.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

export default function AppealsPage() {
  const { data: appealsData, isLoading } = useQuery({
    queryKey: ["appeals"],
    queryFn: () => appealsService.getAppeals(),
  });

  const appeals = appealsData?.data || [];

  if (isLoading) {
    return <div>Loading appeals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Appeals</h2>
        <Button>
          <Icons.add className="mr-2 h-4 w-4" /> New Appeal
        </Button>
      </div>
      <div>
        <DataTable columns={columns} data={appeals} searchKey="appealNumber" />
      </div>
    </div>
  );
}
