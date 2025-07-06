import numpy as np
from sklearn.decomposition import PCA
from umap import UMAP
from typing import Dict, List, Any

def create_visualization(classifier) -> Dict[str, Any]:
    """Create visualization data for embeddings using PCA and UMAP"""
    visualizations = {}
    
    for model_name in classifier.models.keys():
        # Get embeddings for all data points
        embeddings = np.array([
            classifier.embedding_factory.get_embedding(text, model_name)
            for text in classifier.data
        ])
        
        # Apply PCA
        pca = PCA(n_components=2)
        pca_result = pca.fit_transform(embeddings)
        
        # Apply UMAP
        umap = UMAP(n_components=2, random_state=42)
        umap_result = umap.fit_transform(embeddings)
        
        # Prepare visualization data
        visualizations[model_name] = {
            'pca': {
                'x': pca_result[:, 0].tolist(),
                'y': pca_result[:, 1].tolist(),
                'labels': classifier.labels,
                'variance_explained': pca.explained_variance_ratio_.tolist()
            },
            'umap': {
                'x': umap_result[:, 0].tolist(),
                'y': umap_result[:, 1].tolist(),
                'labels': classifier.labels
            }
        }
    
    return visualizations 