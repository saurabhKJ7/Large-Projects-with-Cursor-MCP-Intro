import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { ModelMetrics } from '../types';

const ModelComparison: React.FC = () => {
    const [metrics, setMetrics] = useState<{ [key: string]: ModelMetrics } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/models');
                setMetrics(response.data);
            } catch (err) {
                setError('Failed to load model metrics');
                console.error('Error fetching metrics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return <CircularProgress />;
    }

    if (error || !metrics) {
        return (
            <Typography color="error">
                {error || 'No metrics available'}
            </Typography>
        );
    }

    const prepareChartData = () => {
        const categories = Object.keys(metrics[Object.keys(metrics)[0]].classification_report)
            .filter(key => !['accuracy', 'macro avg', 'weighted avg'].includes(key));

        return categories.map(category => {
            const data: any = { category };
            Object.entries(metrics).forEach(([model, modelMetrics]) => {
                data[`${model}_precision`] = modelMetrics.classification_report[category].precision;
                data[`${model}_recall`] = modelMetrics.classification_report[category].recall;
                data[`${model}_f1`] = modelMetrics.classification_report[category].f1_score;
            });
            return data;
        });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Model Performance Comparison
            </Typography>

            <Grid container spacing={3}>
                {/* Performance Metrics Chart */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2, height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={prepareChartData()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {Object.keys(metrics).map(model => (
                                    <React.Fragment key={model}>
                                        <Bar dataKey={`${model}_precision`} name={`${model} Precision`} fill="#8884d8" />
                                        <Bar dataKey={`${model}_recall`} name={`${model} Recall`} fill="#82ca9d" />
                                        <Bar dataKey={`${model}_f1`} name={`${model} F1`} fill="#ffc658" />
                                    </React.Fragment>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Detailed Metrics Table */}
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Model</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="right">Precision</TableCell>
                                    <TableCell align="right">Recall</TableCell>
                                    <TableCell align="right">F1 Score</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(metrics).map(([model, modelMetrics]) =>
                                    Object.entries(modelMetrics.classification_report)
                                        .filter(([category]) => !['accuracy', 'macro avg', 'weighted avg'].includes(category))
                                        .map(([category, scores]) => (
                                            <TableRow key={`${model}-${category}`}>
                                                <TableCell>{model}</TableCell>
                                                <TableCell>{category}</TableCell>
                                                <TableCell align="right">
                                                    {(scores.precision * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell align="right">
                                                    {(scores.recall * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell align="right">
                                                    {(scores.f1_score * 100).toFixed(2)}%
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ModelComparison; 