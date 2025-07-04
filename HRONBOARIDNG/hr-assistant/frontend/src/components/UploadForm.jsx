import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiFile, FiLoader, FiX } from 'react-icons/fi'
import axios from 'axios'

const UploadForm = ({ onUploadSuccess, onUploadError }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(acceptedFiles => {
    // Only take the first file if multiple are dropped
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false
  })

  const removeFile = () => {
    setFile(null)
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setUploadProgress(0)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })
      
      // Call success callback with document data
      onUploadSuccess(response.data)
      
      // Reset form
      setFile(null)
      setUploadProgress(0)
    } catch (error) {
      console.error('Upload error:', error)
      let errorMessage = 'Failed to upload document'
      
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }
      
      onUploadError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop an HR document here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Supported formats: PDF, DOCX, TXT
        </p>
      </div>
      
      {file && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FiFile className="text-primary-500" />
              <div>
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button 
              onClick={removeFile}
              disabled={uploading}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`btn ${!file ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-primary'} flex items-center space-x-2`}
        >
          {uploading ? (
            <>
              <FiLoader className="animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FiUpload />
              <span>Upload Document</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default UploadForm