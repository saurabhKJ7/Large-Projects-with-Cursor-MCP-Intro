import { useState, useEffect, useRef } from 'react'
import { FiSend, FiLoader } from 'react-icons/fi'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

// Import components
import ChatBox from '../components/ChatBox'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add initial welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your HR Knowledge Assistant. How can I help you with HR policies, benefits, or other company information today?',
        sources: []
      }
    ])
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Format chat history for API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // Send request to backend
      const response = await axios.post('/api/ask', {
        query: input,
        chat_history: chatHistory
      })
      
      // Add assistant response to chat
      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting response:', error)
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        sources: []
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="markdown-content">
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {/* Show sources if available */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <p className="font-semibold">Sources:</p>
                  <ul className="list-disc pl-4">
                    {message.sources.map((source, idx) => (
                      <li key={idx}>{source.document} {source.category && `(${source.category})`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message flex items-center space-x-2">
              <FiLoader className="animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about HR policies, benefits, leave, etc..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary flex items-center justify-center"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat