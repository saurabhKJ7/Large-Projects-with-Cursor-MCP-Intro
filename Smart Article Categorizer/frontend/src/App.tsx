import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  Paper
} from '@mui/material';
import ArticleInput from './components/ArticleInput';
import ResultsDisplay from './components/ResultsDisplay';
import ModelComparison from './components/ModelComparison';
import VisualizationDisplay from './components/VisualizationDisplay';
import { ClassificationResult } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassification = (newResults: ClassificationResult) => {
    setResults(newResults);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Smart Article Categorizer
          </Typography>
          
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <ArticleInput 
              onClassification={handleClassification}
              setLoading={setLoading}
            />
          </Paper>

          {results && (
            <>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <ResultsDisplay results={results} />
              </Paper>

              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <ModelComparison />
              </Paper>

              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <VisualizationDisplay />
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
