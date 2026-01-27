import Link from "next/link";

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-gray-50/40 min-h-screen p-4">
      <div className="font-bold text-xl mb-6">Medical Claims</div>
      <nav className="space-y-2">
        <Link href="/claims" className="block p-2 hover:bg-gray-100 rounded">
          Claims
        </Link>
        <Link href="/denials" className="block p-2 hover:bg-gray-100 rounded">
          Denials
        </Link>
        <Link href="/appeals" className="block p-2 hover:bg-gray-100 rounded">
          Appeals
        </Link>
        <Link href="/payments" className="block p-2 hover:bg-gray-100 rounded">
          Payments
        </Link>
        <Link href="/analytics" className="block p-2 hover:bg-gray-100 rounded">
          Analytics
        </Link>
        <Link
          href="/notifications"
          className="block p-2 hover:bg-gray-100 rounded"
        >
          Notifications
        </Link>
        <Link href="/settings" className="block p-2 hover:bg-gray-100 rounded">
          Settings
        </Link>
      </nav>
    </div>
  );
}
