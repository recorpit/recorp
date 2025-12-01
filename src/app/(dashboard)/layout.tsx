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
      <div className="ml-64 transition-all duration-300">
        <Header />
        <main>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
