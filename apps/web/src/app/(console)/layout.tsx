import { Sidebar } from '@/components/layout/sidebar';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1 py-10">{children}</div>
    </div>
  );
}
