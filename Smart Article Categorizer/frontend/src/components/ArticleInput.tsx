import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import axios from 'axios';
import { ClassificationResult } from '../types';

interface ArticleInputProps {
    onClassification: (results: ClassificationResult) => void;
    setLoading: (loading: boolean) => void;
}

const ArticleInput: React.FC<ArticleInputProps> = ({ onClassification, setLoading }) => {
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) {
            setError('Please enter some text');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/classify', {
                text: text.trim()
            });
            onClassification(response.data);
        } catch (err) {
            setError('Error classifying text. Please try again.');
            console.error('Classification error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="h6" gutterBottom>
                Enter Article Text
            </Typography>
            
            <TextField
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                placeholder="Paste your article text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                error={!!error}
                helperText={error}
                sx={{ mb: 2 }}
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
            >
                Classify Article
            </Button>
        </Box>
    );
};

export default ArticleInput; 