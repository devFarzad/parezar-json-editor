import { auth } from './firebaseClient';

const API_BASE_URL = '/api';

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL'
}

export type PlanType = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface Feature {
  name: string;
  description: string;
  limit?: number;
  icon?: string;
}

export interface Plan {
  id?: string;
  name: string;
  type?: PlanType;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: 'IQD';
  billingCycle: BillingCycle;
  credits: number;
  features: Feature[];
  savingsPercentage?: number;
  upgradeBenefits?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  order?: number;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://configure.parezar.org',
  };
};

export const planService = {
  async getAllPlans(): Promise<Plan[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/plans`, { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch plans');
    }
    return response.json();
  },

  async getPlanById(planId: string): Promise<Plan> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/plans/${planId}`, { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch plan');
    }
    return response.json();
  },

  async createPlan(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(plan),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create plan');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<{ message: string; id: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update plan');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  async deletePlan(planId: string): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },
};