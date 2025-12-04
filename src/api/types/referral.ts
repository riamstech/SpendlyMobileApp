export interface ReferralResponse {
  referrer: {
    id: number;
    name: string;
    referral_code: string;
  };
  referral_code: string;
  referrals: Referral[];
  stats: ReferralStats;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  reward_status: 'pending' | 'claimed';
  reward_type: string;
  rewarded_at: string | null;
  referred_user: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  pending_rewards: number;
  claimed_rewards: number;
  rewards_earned: number;
}

export interface GenerateReferralLinkResponse {
  message?: string;
  referral_code: string;
  share_url: string; // Backend returns 'share_url', which gets transformed to 'shareUrl' in camelCase
}

