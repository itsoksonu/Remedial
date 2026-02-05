'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Claim, PaginatedResponse } from '@/types/claim.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, UserPlus, FileText } from 'lucide-react';

interface ClaimsTableProps {
  data?: PaginatedResponse<Claim>;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ClaimsTable({ data, isLoading, onPageChange }: ClaimsTableProps) {
  const router = useRouter();
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(new Set(data?.claims.map((c) => c.id) || []));
    } else {
      setSelectedClaims(new Set());
    }
  };

  const handleSelectClaim = (claimId: string, checked: boolean) => {
    const newSelected = new Set(selectedClaims);
    if (checked) {
      newSelected.add(claimId);
    } else {
      newSelected.delete(claimId);
    }
    setSelectedClaims(newSelected);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.claims.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No claims found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClaims.size === data.claims.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Claim #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>DOS</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Denial Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.claims.map((claim) => (
              <TableRow
                key={claim.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/claims/${claim.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedClaims.has(claim.id)}
                    onCheckedChange={(checked) =>
                      handleSelectClaim(claim.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {claim.claimNumber}
                </TableCell>
                <TableCell>
                  {claim.patient
                    ? `${claim.patient.firstName} ${claim.patient.lastName}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {claim.provider
                    ? `${claim.provider.firstName} ${claim.provider.lastName}`
                    : '-'}
                </TableCell>
                <TableCell>{claim.payer?.name || '-'}</TableCell>
                <TableCell>{formatDate(claim.dateOfService)}</TableCell>
                <TableCell>{formatCurrency(claim.totalCharge)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{claim.denialCode || '-'}</Badge>
                </TableCell>
                <TableCell>
                  <ClaimStatusBadge status={claim.status} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      claim.priority === 'critical'
                        ? 'destructive'
                        : claim.priority === 'high'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {claim.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {claim.assignedUser
                    ? `${claim.assignedUser.firstName} ${claim.assignedUser.lastName}`
                    : '-'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/claims/${claim.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Appeal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
          {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
          {data.pagination.total} claims
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page === 1}
            onClick={() => onPageChange(data.pagination.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page === data.pagination.totalPages}
            onClick={() => onPageChange(data.pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}