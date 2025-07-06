import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { VisualizationData } from '../types';

const VisualizationDisplay: React.FC = () => {
    const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedModel, setSelectedModel] = useState('word2vec');
    const [visualizationType, setVisualizationType] = useState<'pca' | 'umap'>('pca');

    useEffect(() => {
        const fetchVisualization = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/visualize');
                setVisualizationData(response.data);
            } catch (err) {
                setError('Failed to load visualization data');
                console.error('Error fetching visualization:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVisualization();
    }, []);

    if (loading) {
        return <CircularProgress />;
    }

    if (error || !visualizationData) {
        return (
            <Typography color="error">
                {error || 'No visualization data available'}
            </Typography>
        );
    }

    const prepareChartData = () => {
        const data = visualizationData[selectedModel][visualizationType];
        return data.x.map((x, i) => ({
            x: x,
            y: data.y[i],
            label: data.labels[i]
        }));
    };

    const modelNames = {
        'word2vec': 'Word2Vec',
        'bert': 'BERT',
        'sbert': 'Sentence-BERT',
        'openai': 'OpenAI'
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Embedding Visualization
            </Typography>

            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={selectedModel}
                    exclusive
                    onChange={(_, value) => value && setSelectedModel(value)}
                    size="small"
                    sx={{ mr: 2 }}
                >
                    {Object.entries(modelNames).map(([value, label]) => (
                        <ToggleButton value={value} key={value}>
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <ToggleButtonGroup
                    value={visualizationType}
                    exclusive
                    onChange={(_, value) => value && setVisualizationType(value)}
                    size="small"
                >
                    <ToggleButton value="pca">PCA</ToggleButton>
                    <ToggleButton value="umap">UMAP</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Paper elevation={2} sx={{ p: 2, height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid />
                        <XAxis 
                            dataKey="x"
                            type="number"
                            name={visualizationType === 'pca' ? 'First Principal Component' : 'UMAP Dimension 1'}
                        />
                        <YAxis 
                            dataKey="y"
                            type="number"
                            name={visualizationType === 'pca' ? 'Second Principal Component' : 'UMAP Dimension 2'}
                        />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ payload }) => {
                                if (payload && payload[0]) {
                                    const data = payload[0].payload;
                                    return (
                                        <Paper sx={{ p: 1 }}>
                                            <Typography variant="body2">
                                                Category: {data.label}
                                            </Typography>
                                        </Paper>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Scatter
                            name="Articles"
                            data={prepareChartData()}
                            fill="#8884d8"
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </Paper>

            {visualizationType === 'pca' && (
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Variance Explained: {
                        (visualizationData[selectedModel].pca.variance_explained
                            .reduce((a, b) => a + b, 0) * 100
                        ).toFixed(2)
                    }%
                </Typography>
            )}
        </Box>
    );
};

export default VisualizationDisplay; 