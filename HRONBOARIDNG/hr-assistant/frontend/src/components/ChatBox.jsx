import { useState, useEffect, useRef } from 'react'
import { FiSend, FiLoader } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'

const ChatBox = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    onSendMessage(input)
    setInput('')
  }

  return (
    <div className="chat-container h-full">
      <div className="message-list">
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
      
      <div className="message-input">
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
  )
}

export default ChatBox