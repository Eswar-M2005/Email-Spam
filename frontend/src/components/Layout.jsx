import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13,21,38,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </div>
  )
}
