import Header from "@/components/business-admin/Header";
import TabNav from "@/components/business-admin/TabNav";

export default function BusinessAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header />
      <TabNav />
      <main className="px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
