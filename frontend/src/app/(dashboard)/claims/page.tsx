import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClaimsPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Claims</h2>
          <p className="text-muted-foreground">
            Manage your claims submissions and statuses.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/claims/new">
            <Button>Create Claim</Button>
          </Link>
        </div>
      </div>
      {/* Claims Table would go here */}
    </div>
  );
}
