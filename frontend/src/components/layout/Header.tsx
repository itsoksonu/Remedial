import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
      <div className="font-semibold">Dashboard</div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          Help
        </Button>
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      </div>
    </header>
  );
}
