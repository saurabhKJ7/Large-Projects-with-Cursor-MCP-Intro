export interface ModelResult {
    prediction: string;
    confidence: number;
    confidence_scores: {
        [key: string]: number;
    };
}

export interface ClassificationResult {
    [key: string]: ModelResult;
}

export interface ModelMetrics {
    classification_report: {
        [key: string]: {
            precision: number;
            recall: number;
            f1_score: number;
            support: number;
        };
    };
    confusion_matrix: number[][];
}

export interface VisualizationData {
    [key: string]: {
        pca: {
            x: number[];
            y: number[];
            labels: string[];
            variance_explained: number[];
        };
        umap: {
            x: number[];
            y: number[];
            labels: string[];
        };
    };
} 