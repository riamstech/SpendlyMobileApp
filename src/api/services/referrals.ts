import { apiClient } from '../client';
import {
  ReferralResponse,
  GenerateReferralLinkResponse,
} from '../types/referral';

export const referralsService = {
  /**
   * Generate referral link and code
   */
  async generateReferralLink(): Promise<GenerateReferralLinkResponse> {
    return apiClient.post<GenerateReferralLinkResponse>('/referrals', {});
  },

  /**
   * Get user referrals with stats
   */
  async getUserReferrals(userId: number): Promise<ReferralResponse> {
    return apiClient.get<ReferralResponse>(`/referrals/${userId}`);
  },

  /**
   * Get referral reward days configuration
   */
  async getReferralRewardDays(): Promise<{ referral_reward_days: number; referralRewardDays?: number }> {
    const response = await apiClient.get<any>('/referral-reward-days');
    // API client may transform snake_case to camelCase, so handle both
    return {
      referral_reward_days: response.referralRewardDays || response.referral_reward_days || 30,
      referralRewardDays: response.referralRewardDays || response.referral_reward_days || 30,
    };
  },
};

