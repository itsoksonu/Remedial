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
import { Claim } from "@/services/claims.service";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/lib/icons";

export const columns: ColumnDef<Claim>[] = [
  {
    accessorKey: "claimNumber",
    header: "Claim #",
  },
  {
    accessorKey: "patient.firstName",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original.patient;
      return patient ? `${patient.firstName} ${patient.lastName}` : "N/A";
    },
  },
  {
    accessorKey: "payer.name",
    header: "Payer",
  },
  {
    accessorKey: "dateOfService",
    header: "Date of Service",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dateOfService"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "totalCharge",
    header: "Amount",
    cell: ({ row }) => {
      const val = row.getValue("totalCharge");
      const amount =
        typeof val === "string" ? parseFloat(val) : (val as number);
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = (row.getValue("priority") as string) || "medium";
      let variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning" = "outline";

      switch (priority) {
        case "critical":
          variant = "destructive";
          break;
        case "high":
          variant = "warning";
          break;
        case "medium":
          variant = "secondary";
          break;
        default:
          variant = "outline";
      }
      return (
        <Badge variant={variant} className="capitalize">
          {priority}
        </Badge>
      );
    },
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
        case "paid":
        case "resolved":
          variant = "success";
          break;
        case "rejected":
          variant = "destructive";
          break;
        case "pending":
        case "in_progress":
          variant = "warning";
          break;
        case "appealed":
          variant = "secondary";
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
    id: "actions",
    cell: ({ row }) => {
      const claim = row.original;

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
              onClick={() => navigator.clipboard.writeText(claim.id)}
            >
              Copy Claim ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Assign to User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
