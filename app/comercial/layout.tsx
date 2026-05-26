'use client'

import ComercialSidebar from '@/app/components/ComercialSidebar'
import styles from './layout.module.css'

export default function ComercialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.container}>
      <ComercialSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
