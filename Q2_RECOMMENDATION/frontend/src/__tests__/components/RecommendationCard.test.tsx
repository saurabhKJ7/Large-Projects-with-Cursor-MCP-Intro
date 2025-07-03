import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecommendationCard } from '../../components/RecommendationCard';
import { createMockProduct, createMockAuthState } from '../utils/mockData';
import { AuthContext } from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

const mockTrackInteraction = jest.fn();
jest.mock('../../services/api', () => ({
  trackInteraction: (...args: any[]) => mockTrackInteraction(...args),
}));

describe('RecommendationCard', () => {
  const mockProduct = createMockProduct();
  const mockReason = 'Based on your browsing history';
  const mockOnClick = jest.fn();

  const renderComponent = (isAuthenticated: boolean = true) => {
    const authState = createMockAuthState(isAuthenticated);
    return render(
      <AuthContext.Provider value={authState}>
        <MemoryRouter>
          <RecommendationCard
            product={mockProduct}
            reason={mockReason}
            onClick={mockOnClick}
          />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product information correctly', () => {
    renderComponent();

    expect(screen.getByText(mockProduct.productName)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
  });

  it('shows reason when info button is clicked', () => {
    renderComponent();

    const infoButton = screen.getByLabelText('Why recommended?');
    fireEvent.click(infoButton);

    expect(screen.getByText(mockReason)).toBeInTheDocument();
  });

  it('handles product click', () => {
    renderComponent();

    const productCard = screen.getByText(mockProduct.productName);
    fireEvent.click(productCard);

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
  });

  describe('feedback functionality', () => {
    it('shows feedback buttons when authenticated', () => {
      renderComponent(true);

      expect(screen.getByLabelText('This recommendation was helpful')).toBeInTheDocument();
      expect(screen.getByLabelText('This recommendation wasn\'t helpful')).toBeInTheDocument();
    });

    it('hides feedback buttons when not authenticated', () => {
      renderComponent(false);

      expect(screen.queryByLabelText('This recommendation was helpful')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('This recommendation wasn\'t helpful')).not.toBeInTheDocument();
    });

    it('handles like feedback', async () => {
      renderComponent(true);

      const likeButton = screen.getByLabelText('This recommendation was helpful');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(mockTrackInteraction).toHaveBeenCalledWith({
          productId: mockProduct.id,
          type: 'like',
          metadata: {
            source: 'recommendation_feedback',
            reason: mockReason,
          },
        });
      });
    });

    it('handles dislike feedback', async () => {
      renderComponent(true);

      const dislikeButton = screen.getByLabelText('This recommendation wasn\'t helpful');
      fireEvent.click(dislikeButton);

      await waitFor(() => {
        expect(mockTrackInteraction).toHaveBeenCalledWith({
          productId: mockProduct.id,
          type: 'dislike',
          metadata: {
            source: 'recommendation_feedback',
            reason: mockReason,
          },
        });
      });
    });

    it('disables feedback buttons while submitting', async () => {
      mockTrackInteraction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderComponent(true);

      const likeButton = screen.getByLabelText('This recommendation was helpful');
      fireEvent.click(likeButton);

      expect(likeButton).toBeDisabled();
      expect(screen.getByLabelText('This recommendation wasn\'t helpful')).toBeDisabled();

      await waitFor(() => {
        expect(likeButton).not.toBeDisabled();
      });
    });
  });
}); 