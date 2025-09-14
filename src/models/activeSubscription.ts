// src/models/activeSubscription.ts
export interface PackageFeature {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface ActiveSubscription {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'pending_activation' | 'expired';
  type: string;                        // ← أضفناها هنا
  activation_code: string | null;
  features: PackageFeature[];
}
