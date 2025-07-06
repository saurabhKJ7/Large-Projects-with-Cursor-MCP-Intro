import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    LinearProgress,
    Chip
} from '@mui/material';
import { ClassificationResult } from '../types';

interface ResultsDisplayProps {
    results: ClassificationResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
    const modelNames = {
        'word2vec': 'Word2Vec',
        'bert': 'BERT',
        'sbert': 'Sentence-BERT',
        'openai': 'OpenAI'
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        return 'error';
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Classification Results
            </Typography>

            <Grid container spacing={3}>
                {Object.entries(results).map(([model, result]) => (
                    <Grid item xs={12} md={6} key={model}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {modelNames[model as keyof typeof modelNames]}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Prediction: 
                                    <Chip 
                                        label={result.prediction}
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                </Typography>
                                
                                <Typography variant="body2" gutterBottom>
                                    Confidence: {(result.confidence * 100).toFixed(2)}%
                                </Typography>
                                
                                <LinearProgress 
                                    variant="determinate"
                                    value={result.confidence * 100}
                                    color={getConfidenceColor(result.confidence)}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                                Confidence Scores:
                            </Typography>
                            
                            {Object.entries(result.confidence_scores).map(([category, score]) => (
                                <Box key={category} sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        {category}: {(score * 100).toFixed(2)}%
                                    </Typography>
                                    <LinearProgress 
                                        variant="determinate"
                                        value={score * 100}
                                        sx={{ height: 5, borderRadius: 5 }}
                                    />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ResultsDisplay; 