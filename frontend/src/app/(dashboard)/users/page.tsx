"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { userService } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

export default function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getUsers(),
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Button>
          <Icons.add className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      <div>
        <DataTable columns={columns} data={users || []} searchKey="email" />
      </div>
    </div>
  );
}
