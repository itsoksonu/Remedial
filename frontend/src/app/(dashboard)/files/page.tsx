"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { fileService, FileUpload } from "@/services/files.service";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

const columns: ColumnDef<FileUpload>[] = [
  {
    accessorKey: "originalFilename",
    header: "Filename",
  },
  {
    accessorKey: "fileType",
    header: "Type",
  },
  {
    accessorKey: "sizeBytes",
    header: "Size (KB)",
    cell: ({ row }) => (Number(row.getValue("sizeBytes")) / 1024).toFixed(2),
  },
  {
    accessorKey: "createdAt",
    header: "Uploaded",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
  },
];

export default function FilesPage() {
  const { data: filesData, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => fileService.getFiles(),
  });

  const files = filesData?.data || [];

  if (isLoading) return <div>Loading files...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Files</h2>
        <Button>
          <Icons.upload className="mr-2 h-4 w-4" /> Upload File
        </Button>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={files}
          searchKey="originalFilename"
        />
      </div>
    </div>
  );
}
