import { useState, useEffect } from 'react'
import { FiUpload, FiFile, FiTrash2, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'

// Import components
import UploadForm from '../components/UploadForm'

const Admin = () => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.get('/api/admin/docs')
      setDocuments(response.data)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    setIsDeleting(true)
    setError(null)
    setSuccess(null)
    
    try {
      await axios.delete(`/api/admin/docs/${docId}`)
      setSuccess('Document deleted successfully')
      // Remove document from state
      setDocuments(prev => prev.filter(doc => doc.id !== docId))
    } catch (err) {
      console.error('Error deleting document:', err)
      setError('Failed to delete document. Please try again.')
    } finally {
      setIsDeleting(false)
      
      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(null), 3000)
      }
    }
  }

  const handleUploadSuccess = (newDoc) => {
    setSuccess('Document uploaded successfully')
    // Add new document to state
    setDocuments(prev => [...prev, newDoc])
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleUploadError = (errorMsg) => {
    setError(errorMsg || 'Failed to upload document. Please try again.')
  }

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Upload HR Documents</h2>
        
        {/* Status messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center space-x-2">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center space-x-2">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}
        
        <UploadForm 
          onUploadSuccess={handleUploadSuccess} 
          onUploadError={handleUploadError} 
        />
      </div>
      
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Manage Documents</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <FiLoader className="animate-spin text-2xl text-primary-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiFile className="mx-auto text-4xl mb-2" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <FiFile className="text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{doc.filename}</h3>
                      <p className="text-sm text-gray-500">{formatDate(doc.upload_date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete document"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                
                {doc.categories && doc.categories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.categories.map((category, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin