"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appeal } from "@/services/appeals.service";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/lib/icons";

export const columns: ColumnDef<Appeal>[] = [
  {
    accessorKey: "appealNumber",
    header: "Appeal #",
  },
  {
    accessorKey: "claim.claimNumber",
    header: "Ref Claim #",
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("level")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning" = "default";

      switch (status) {
        case "approved":
          variant = "success";
          break;
        case "denied":
          variant = "destructive";
          break;
        case "pending_review":
          variant = "warning";
          break;
        case "submitted":
          variant = "secondary";
          break;
        case "draft":
          variant = "outline";
          break;
        default:
          variant = "default";
      }

      return (
        <Badge variant={variant} className="capitalize">
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appeal = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.moreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(appeal.id)}
            >
              Copy Appeal ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit Draft</DropdownMenuItem>
            <DropdownMenuItem>Generate AI Letter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
