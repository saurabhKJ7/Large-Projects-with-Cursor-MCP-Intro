import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { FiMessageSquare, FiSettings, FiMenu, FiX } from 'react-icons/fi'

// Import pages
import Chat from './pages/Chat'
import Admin from './pages/Admin'

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">HR Knowledge Assistant</h1>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-4 items-center">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-1">
                  <FiMessageSquare />
                  <span>Chat</span>
                </div>
              </Link>
              <Link 
                to="/admin" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/admin' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-1">
                  <FiSettings />
                  <span>Admin</span>
                </div>
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center space-x-2">
                  <FiMessageSquare />
                  <span>Chat</span>
                </div>
              </Link>
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/admin' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center space-x-2">
                  <FiSettings />
                  <span>Admin</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            HR Onboarding Knowledge Assistant &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App