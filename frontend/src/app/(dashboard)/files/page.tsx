"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { fileService } from "@/services/files.service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FilesPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => fileService.getFiles(),
  });

  const handleUpload = async () => {
    if (!selectedFiles) return;
    // Handle file upload logic here
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Management"
        description="Upload and manage claim files and documents"
      />

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="flex-1"
            />
            <Button onClick={handleUpload} disabled={!selectedFiles}>
              <Icons.upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: CSV, PDF, XLSX, DOC
          </p>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files?.data && files.data.length > 0 ? (
              files.data.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-md bg-primary/10 p-3">
                      <Icons.files className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {file.fileType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Icons.download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Icons.denials className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Icons.files className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
