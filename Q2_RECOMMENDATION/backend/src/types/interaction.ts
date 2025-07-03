import { z } from 'zod';

export type InteractionType = 'search' | 'view' | 'like' | 'purchase' | 'addToCart' | 'removeFromCart';

export interface Interaction {
  id: string;
  createdAt: Date;
  type: InteractionType;
  userId: string;
  productId: string;
}

export const InteractionSchema = z.object({
  type: z.enum(['search', 'view', 'like', 'purchase', 'addToCart', 'removeFromCart']),
  productId: z.string(),
});

export const InteractionWeights = {
  search: 1,
  view: 2,
  like: 3,
  addToCart: 4,
  purchase: 5,
  removeFromCart: -2,
} as const;

export function calculateInteractionWeight(type: InteractionType): number {
  return InteractionWeights[type];
}

export function calculateCategoryPreference(
  interactions: Interaction[],
  categoryMap: Record<string, string>
): Record<string, number> {
  const preferences: Record<string, number> = {};

  interactions.forEach((interaction) => {
    const category = categoryMap[interaction.productId];
    if (category) {
      const weight = calculateInteractionWeight(interaction.type);
      preferences[category] = (preferences[category] || 0) + weight;
    }
  });

  return preferences;
}

export const UserPreferenceSchema = z.object({
  userId: z.string(),
  category: z.string(),
  weight: z.number(),
});

export const InteractionStatsSchema = z.object({
  totalInteractions: z.number(),
  uniqueUsers: z.number(),
  uniqueProducts: z.number(),
  interactionsByType: z.record(z.number()),
});

export const RecommendationScoreSchema = z.object({
  productId: z.string(),
  score: z.number(),
  confidence: z.number(),
});

export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type InteractionStats = z.infer<typeof InteractionStatsSchema>;
export type RecommendationScore = z.infer<typeof RecommendationScoreSchema>; 