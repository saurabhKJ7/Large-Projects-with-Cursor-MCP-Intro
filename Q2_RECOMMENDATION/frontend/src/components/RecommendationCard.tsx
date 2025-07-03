import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  InfoOutlined,
  ThumbUpOutlined,
  ThumbDownOutlined,
} from '@mui/icons-material';
import { Product } from '../../../backend/src/types/product';
import { ProductCard } from './ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { trackInteraction } from '../services/api';

interface RecommendationCardProps {
  product: Product;
  reason: string;
  onClick?: (product: Product) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  product,
  reason,
  onClick,
}) => {
  const { isAuthenticated } = useAuth();
  const [showReason, setShowReason] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!isAuthenticated || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await trackInteraction({
        productId: product.id,
        type: type === 'like' ? 'like' : 'dislike',
        metadata: {
          source: 'recommendation_feedback',
          reason,
        },
      });
      setFeedback(type);
    } catch (error) {
      console.error('Error submitting recommendation feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <ProductCard product={product} onClick={onClick} />
      </Box>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Why recommended?">
            <IconButton
              size="small"
              onClick={() => setShowReason(!showReason)}
              color={showReason ? 'primary' : 'default'}
            >
              <InfoOutlined />
            </IconButton>
          </Tooltip>
        </Box>
        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="This recommendation was helpful">
              <IconButton
                size="small"
                onClick={() => handleFeedback('like')}
                color={feedback === 'like' ? 'primary' : 'default'}
                disabled={isSubmitting}
              >
                {feedback === 'like' ? <ThumbUp /> : <ThumbUpOutlined />}
              </IconButton>
            </Tooltip>
            <Tooltip title="This recommendation wasn't helpful">
              <IconButton
                size="small"
                onClick={() => handleFeedback('dislike')}
                color={feedback === 'dislike' ? 'error' : 'default'}
                disabled={isSubmitting}
              >
                {feedback === 'dislike' ? <ThumbDown /> : <ThumbDownOutlined />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardActions>
      <Collapse in={showReason}>
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            {reason}
          </Typography>
        </Box>
      </Collapse>
    </Card>
  );
}; 