// src/app/(auth)/layout.tsx
// Layout per pagine di autenticazione (senza sidebar/header)

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
