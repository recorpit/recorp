// src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-0 lg:ml-64 transition-all duration-300">
        <Header />
        <main>
          <div className="p-4 lg:p-6 pt-16 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}