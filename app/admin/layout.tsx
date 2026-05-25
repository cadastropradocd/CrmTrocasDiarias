'use client'

import AdminSidebar from '@/app/components/AdminSidebar'
import styles from './layout.module.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.container}>
      <AdminSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}