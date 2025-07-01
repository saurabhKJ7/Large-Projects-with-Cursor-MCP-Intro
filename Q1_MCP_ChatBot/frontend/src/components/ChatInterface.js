import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: question }]);

    try {
      const response = await axios.post(`${API_URL}/ask`, {
        question: question
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        content: response.data.answer,
        sources: response.data.sources
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while fetching the response');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom renderer for code blocks
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        {messages.map((message, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: message.type === 'user' ? 'primary.dark' : 'background.paper',
              maxWidth: '80%',
              ml: message.type === 'user' ? 'auto' : 0,
            }}
          >
            <Typography
              component="div"
              sx={{
                '& > p:first-of-type': { mt: 0 },
                '& > p:last-child': { mb: 0 },
              }}
            >
              <ReactMarkdown components={renderers}>
                {message.content}
              </ReactMarkdown>
            </Typography>
            
            {message.sources && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Sources:
                </Typography>
                <ul style={{ margin: '0.5em 0', paddingLeft: '1.5em' }}>
                  {message.sources.map((source, idx) => (
                    <li key={idx}>
                      <Typography variant="caption" component="span">
                        <a
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit' }}
                        >
                          {source}
                        </a>
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Paper>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Input Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a question about MCP..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={isLoading || !input.trim()}
          sx={{ p: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>
    </Box>
  );
}

export default ChatInterface; 