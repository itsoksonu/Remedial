"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { userService } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

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
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={
          <Button>
            <Icons.add className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={users || []} searchKey="email" />
        </CardContent>
      </Card>
    </div>
  );
}
