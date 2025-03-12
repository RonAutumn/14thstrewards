import type { RewardSchema, TransactionSchema, RewardCodeSchema } from '@/lib/db/schema/rewards';

export type Reward = Omit<RewardSchema, '_id'> & { _id?: string; reward_id: string };
export type Transaction = Omit<TransactionSchema, '_id'> & { _id?: string };
export type RewardCode = Omit<RewardCodeSchema, '_id'> & { _id?: string };

export interface User {
    _id: string;
    userId: string;
    name?: string;
    email: string;
    points: number;
    membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    createdAt: string;
}

export interface UsersResponse {
    users: User[];
}

export interface TransactionsResponse {
    transactions: Transaction[];
}

export interface RewardsResponse {
    rewards: Reward[];
}

export interface TierData {
    tier_id: string;
    name: string;
    level: number;
    pointsThreshold: number;
    benefits: {
        pointMultiplier: number;
        discountPercentage: number;
        freeShipping: boolean;
        prioritySupport: boolean;
        earlyAccess: boolean;
        exclusiveEvents: boolean;
        birthdayBonus: number;
        referralBonus: number;
        customBenefits: string[];
    };
    progressionRequirements: {
        minPurchaseCount: number;
        minTotalSpent: number;
        minDaysActive: number;
        additionalRequirements: string[];
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const defaultBenefits = {
    pointMultiplier: 1,
    discountPercentage: 0,
    freeShipping: false,
    prioritySupport: false,
    earlyAccess: false,
    exclusiveEvents: false,
    birthdayBonus: 0,
    referralBonus: 0,
    customBenefits: [],
};

const defaultProgressionRequirements = {
    minPurchaseCount: 0,
    minTotalSpent: 0,
    minDaysActive: 0,
    additionalRequirements: [],
};

const TIER_MULTIPLIERS = {
    BRONZE: 1,
    SILVER: 1.2,
    GOLD: 1.5,
    PLATINUM: 2
} as const;

export const rewardsService = {
    async getRewards(userTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'): Promise<Reward[]> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards${userTier ? `?tier=${userTier}` : ''}`);
        if (!response.ok) {
            throw new Error('Failed to fetch rewards');
        }
        const data = await response.json();
        return data.rewards;
    },

    async getUserPoints(userId: string): Promise<number> {
        if (!userId) {
            console.log('No userId provided for points fetch');
            return 0;
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/rewards/users/${userId}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Failed to fetch user points:', {
                    status: response.status,
                    error: errorData.error || 'Unknown error',
                    userId
                });
                return 0; // Return 0 points instead of throwing
            }
            
            const data = await response.json();
            return data.points || 0;
        } catch (error) {
            console.error('Error fetching user points:', {
                error,
                userId,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            return 0; // Return 0 points instead of throwing
        }
    },

    async getUserTransactions(userId: string): Promise<Transaction[]> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/transactions/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user transactions');
        }
        const data = await response.json();
        return data.transactions;
    },

    async redeemReward(userId: string, rewardId: string): Promise<{ success: boolean; points?: number }> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        try {
            const response = await fetch(`${baseUrl}/api/rewards/${rewardId}/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Reward redemption failed:', data);
                throw new Error(data.error || 'Failed to redeem reward');
            }

            return {
                success: true,
                points: data.points
            };
        } catch (error) {
            console.error('Reward redemption error:', error);
            throw error;
        }
    },

    async createReward(reward: Omit<Reward, '_id' | 'createdAt' | 'updatedAt' | 'reward_id'>): Promise<Reward> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reward),
        });
        if (!response.ok) {
            throw new Error('Failed to create reward');
        }
        const data = await response.json();
        return data.reward;
    },

    async updateReward(rewardId: string, updates: Partial<Reward>): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/${rewardId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reward_id: rewardId, ...updates }),
        });
        if (!response.ok) {
            throw new Error('Failed to update reward');
        }
    },

    async deleteReward(rewardId: string): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/${rewardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reward_id: rewardId }),
        });
        if (!response.ok) {
            throw new Error('Failed to delete reward');
        }
    },

    async getAvailableRewards(userId?: string): Promise<Reward[]> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        try {
            const url = userId 
                ? `${baseUrl}/api/rewards/available?userId=${userId}`
                : `${baseUrl}/api/rewards/available`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch available rewards');
            }
            const data = await response.json();
            return data.rewards || [];
        } catch (error) {
            console.error('Error fetching available rewards:', error);
            return []; // Return empty array if fetch fails
        }
    },

    async getUserProfile(userId: string): Promise<User | null> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return response.json();
    },

    async updateUserPoints(userId: string, points: number, reason?: string): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        console.log('Debug - Received parameters:', {
            userId,
            points,
            reason,
            pointsType: typeof points,
            reasonType: typeof reason
        });

        // Validate inputs before making request
        if (!userId) throw new Error('User ID is required');
        if (typeof points !== 'number') throw new Error('Points must be a number');

        // Create request body as an object first
        const data = {
            points
        };

        // Only add reason if provided
        if (reason) {
            data['reason'] = reason;
        }

        const requestBody = JSON.stringify(data);
        console.log('Debug - Request details:', {
            url: `${baseUrl}/api/rewards/points/${userId}`,
            method: 'PATCH',
            data,
            requestBody,
            requestBodyLength: requestBody.length
        });

        const response = await fetch(`${baseUrl}/api/rewards/points/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody
        });

        const responseText = await response.text();
        console.log('Debug - Response:', {
            status: response.status,
            text: responseText,
            requestData: data,
            requestBody
        });

        if (!response.ok) {
            let error;
            try {
                const errorData = JSON.parse(responseText);
                error = errorData.error || 'Failed to update points';
            } catch (e) {
                error = 'Failed to update points';
            }
            throw new Error(error);
        }
    },

    async addPoints(userId: string, points: number, description: string): Promise<boolean> {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/rewards/transactions/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'EARN',
                    points,
                    description,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to add points:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            console.error('Error in addPoints:', error);
            throw error;
        }
    },

    async addPointsForPurchase(userId: string | null | undefined, orderAmount: number): Promise<number> {
        // If no user ID is provided or user is not signed in, return 0 points
        if (!userId) {
            console.log('No points awarded - user not signed in');
            return 0;
        }

        try {
            if (typeof orderAmount !== 'number' || orderAmount < 0) {
                throw new Error('Invalid order amount');
            }

            // Get user profile to determine tier
            const userProfile = await this.getUserProfile(userId);
            if (!userProfile) {
                console.log('No points awarded - user profile not found');
                return 0;
            }

            // Get user's tier and corresponding multiplier
            const userTier = (userProfile.membership_level || 'BRONZE').toUpperCase() as keyof typeof TIER_MULTIPLIERS;
            const tierMultiplier = TIER_MULTIPLIERS[userTier] || TIER_MULTIPLIERS.BRONZE;

            // Base points calculation (10 points per dollar spent)
            const basePoints = Math.floor(orderAmount * 10);

            // Apply tier multiplier
            const totalPoints = Math.floor(basePoints * tierMultiplier);

            if (totalPoints <= 0) {
                console.log('No points to award for amount:', orderAmount);
                return 0;
            }

            const description = `Points earned from purchase of $${orderAmount.toFixed(2)} (${basePoints} base points × ${tierMultiplier}x ${userTier} multiplier)`;

            try {
                const success = await this.addPoints(
                    userId,
                    totalPoints,
                    description
                );

                if (!success) {
                    console.error('Failed to add points for purchase');
                    return 0;
                }

                return totalPoints;
            } catch (error) {
                console.error('Error adding points:', error);
                return 0;
            }
        } catch (error) {
            console.error('Failed to process points for purchase:', error);
            return 0;
        }
    },

    async redeemPoints(userId: string, pointsToRedeem: number, description: string): Promise<boolean> {
        try {
            // Validate input
            if (!userId || pointsToRedeem <= 0) {
                throw new Error('Invalid input parameters');
            }

            // Get current points
            const currentPoints = await this.getUserPoints(userId);
            if (currentPoints < pointsToRedeem) {
                throw new Error('Insufficient points');
            }

            // Deduct points
            const success = await this.addPoints(
                userId,
                -pointsToRedeem,
                description
            );

            if (!success) {
                throw new Error('Failed to redeem points');
            }

            return true;
        } catch (error) {
            console.error('Failed to redeem points:', error);
            return false;
        }
    },

    async calculatePointsToNextTier(userId: string): Promise<{
        currentTier: string;
        nextTier: string;
        pointsNeeded: number;
    }> {
        const points = await this.getUserPoints(userId);

        const tiers = {
            Bronze: { min: 0, max: 999 },
            Silver: { min: 1000, max: 2499 },
            Gold: { min: 2500, max: 4999 },
            Platinum: { min: 5000, max: Infinity }
        };

        let currentTier = 'Bronze';
        let nextTier = 'Silver';
        let pointsNeeded = 1000;

        if (points >= tiers.Platinum.min) {
            currentTier = 'Platinum';
            nextTier = 'Platinum';
            pointsNeeded = 0;
        } else if (points >= tiers.Gold.min) {
            currentTier = 'Gold';
            nextTier = 'Platinum';
            pointsNeeded = tiers.Platinum.min - points;
        } else if (points >= tiers.Silver.min) {
            currentTier = 'Silver';
            nextTier = 'Gold';
            pointsNeeded = tiers.Gold.min - points;
        } else {
            pointsNeeded = tiers.Silver.min - points;
        }

        return { currentTier, nextTier, pointsNeeded };
    },

    async addTransaction(transaction: Omit<Transaction, '_id' | 'date'>): Promise<Transaction> {
        const response = await fetch('/api/rewards/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
        })
        if (!response.ok) {
            throw new Error('Failed to add transaction')
        }
        return response.json()
    },

    async getTransactionHistory(userId: string): Promise<Transaction[]> {
        const response = await fetch(`/api/rewards/transactions/${userId}`)
        if (!response.ok) {
            throw new Error('Failed to fetch transaction history')
        }
        return response.json()
    },

    async getPointsHistory(): Promise<Transaction[]> {
        const response = await fetch('/api/rewards/points-history')
        if (!response.ok) {
            throw new Error('Failed to fetch points history')
        }
        return response.json()
    },

    async updateUserMembership(userId: string, membershipLevel: Reward['available']): Promise<void> {
        const response = await fetch(`/api/rewards/users/${userId}/membership`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ available: membershipLevel }),
        })
        if (!response.ok) {
            throw new Error('Failed to update user membership')
        }
    },

    async getAllUsers(): Promise<UsersResponse> {
        const response = await fetch('/api/rewards/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    },

    async getAllTransactions(): Promise<TransactionsResponse> {
        const response = await fetch('/api/rewards/transactions');
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }
        return response.json();
    },

    async getAllRewardLimits(): Promise<any[]> {
        const response = await fetch('/api/rewards/limits');
        if (!response.ok) {
            throw new Error('Failed to fetch reward limits');
        }
        const data = await response.json();
        return data.limits;
    },

    async createRewardLimit(rewardId: string, limitType: string, value: number): Promise<any> {
        const response = await fetch('/api/rewards/limits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rewardId,
                limitType,
                value
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create reward limit');
        }
        return response.json();
    },

    async updateRewardLimit(limitId: string, value: number): Promise<void> {
        const response = await fetch('/api/rewards/limits', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                limitId,
                value
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update reward limit');
        }
    },

    async deleteRewardLimit(limitId: string): Promise<void> {
        const response = await fetch('/api/rewards/limits', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                limitId
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete reward limit');
        }
    },

    // Reward Codes CRUD
    async getRewardCodes(rewardId?: string): Promise<RewardCode[]> {
        const url = rewardId ?
            `/api/rewards/${rewardId}/codes` :
            '/api/reward-codes';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch reward codes');
        }
        const data = await response.json();
        return data.codes;
    },

    async createRewardCode(data: {
        reward_id: string;
        code?: string;
        pointsValue?: number;
        expiresAt?: Date;
        isUnlimitedUse?: boolean;
        itemDetails?: {
            name: string;
            description: string;
            value: number;
        };
    }): Promise<RewardCode> {
        const response = await fetch('/api/reward-codes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create reward code');
        }
        return response.json();
    },

    async updateRewardCode(code: string, data: Partial<RewardCode>): Promise<RewardCode> {
        const response = await fetch(`/api/reward-codes/${code}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update reward code');
        }
        return response.json();
    },

    async deleteRewardCode(code: string): Promise<void> {
        const response = await fetch(`/api/reward-codes/${code}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete reward code');
        }
    },

    async generateRewardCodes(data: {
        reward_id: string;
        quantity: number;
        pointsValue?: number;
        expiresAt?: Date;
        isUnlimitedUse?: boolean;
        itemDetails?: {
            name: string;
            description: string;
            value: number;
        };
    }): Promise<RewardCode[]> {
        const response = await fetch('/api/reward-codes/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to generate reward codes');
        }
        const result = await response.json();
        return result.codes;
    },

    async validateRewardCode(code: string): Promise<{
        isValid: boolean;
        reward?: Reward;
        pointsValue?: number;
        itemDetails?: {
            name: string;
            description: string;
            value: number;
        };
    }> {
        const response = await fetch(`/api/reward-codes/${code}/validate`);
        if (!response.ok) {
            throw new Error('Failed to validate reward code');
        }
        return response.json();
    },

    async getTierAnalytics(): Promise<{
        userDistribution: Record<string, number>;
        averagePoints: Record<string, number>;
        progressionRates: Record<string, number>;
    }> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers/analytics`);
        if (!response.ok) {
            throw new Error('Failed to fetch tier analytics');
        }
        const data = await response.json();
        return data;
    },

    async getTiers(): Promise<TierData[]> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers`);
        if (!response.ok) {
            throw new Error('Failed to fetch tiers');
        }
        const data = await response.json();
        return data.tiers;
    },

    async createTier(tierData: Omit<TierData, 'createdAt' | 'updatedAt'>): Promise<TierData> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...tierData,
                benefits: {
                    ...defaultBenefits,
                    ...tierData.benefits,
                },
                progressionRequirements: {
                    ...defaultProgressionRequirements,
                    ...tierData.progressionRequirements,
                },
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to create tier');
        }
        const data = await response.json();
        return data.tier;
    },

    async updateTier(tierId: string, updates: Partial<TierData>): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers/${tierId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...updates,
                benefits: updates.benefits ? {
                    ...defaultBenefits,
                    ...updates.benefits,
                } : undefined,
                progressionRequirements: updates.progressionRequirements ? {
                    ...defaultProgressionRequirements,
                    ...updates.progressionRequirements,
                } : undefined,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to update tier');
        }
    },

    async deleteTier(tierId: string): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers/${tierId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete tier');
        }
    },

    async checkTierEligibility(userId: string, targetTier: string): Promise<{
        eligible: boolean;
        missingRequirements: string[];
    }> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/rewards/tiers/eligibility?userId=${userId}&targetTier=${targetTier}`);
        if (!response.ok) {
            throw new Error('Failed to check tier eligibility');
        }
        const data = await response.json();
        return data;
    },

    async validateAndProcessCheckoutRewards(
        userId: string,
        redeemedRewards: { reward_id: string; pointsCost: number }[]
    ): Promise<{ 
        success: boolean; 
        totalPointsDeducted: number;
        remainingPoints: number;
        error?: string;
    }> {
        try {
            // Get current points
            const currentPoints = await this.getUserPoints(userId);
            
            // Calculate total points needed
            const totalPointsNeeded = redeemedRewards.reduce(
                (total, reward) => total + reward.pointsCost, 
                0
            );

            // Validate if user has enough points
            if (currentPoints < totalPointsNeeded) {
                return {
                    success: false,
                    totalPointsDeducted: 0,
                    remainingPoints: currentPoints,
                    error: `Insufficient points. Required: ${totalPointsNeeded}, Available: ${currentPoints}`
                };
            }

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            
            // Process each reward redemption
            for (const reward of redeemedRewards) {
                const response = await fetch(`${baseUrl}/api/rewards/${reward.reward_id}/redeem`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        userId,
                        isCheckout: true // Flag to indicate this is a checkout redemption
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to process reward redemption');
                }
            }

            // Get updated points after all redemptions
            const updatedPoints = await this.getUserPoints(userId);

            return {
                success: true,
                totalPointsDeducted: totalPointsNeeded,
                remainingPoints: updatedPoints
            };
        } catch (error) {
            console.error('Failed to process checkout rewards:', error);
            return {
                success: false,
                totalPointsDeducted: 0,
                remainingPoints: await this.getUserPoints(userId),
                error: error instanceof Error ? error.message : 'Failed to process rewards'
            };
        }
    },
} 