"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/lib/icons";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
  });

  const notifications = notificationsData?.data || [];

  const markReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (isLoading) return <div>Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <div className="text-muted-foreground">No notifications.</div>
        ) : (
          notifications.map((n: any) => (
            <Card key={n.id} className={n.isRead ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">
                    {n.title}
                  </CardTitle>
                  {!n.isRead && (
                    <Badge
                      variant="destructive"
                      className="h-2 w-2 rounded-full p-0"
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {n.message}
                </p>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
