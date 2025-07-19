'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, MinusCircle, Save, ArrowLeft } from 'lucide-react';
import { Plan, BillingCycle, PlanType, Feature, planService } from '@/lib/planService';

export default function CreatePlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Partial<Plan>>({
    name: '',
    type: 'basic',
    description: '',
    price: 0,
    originalPrice: undefined,
    currency: 'IQD',
    billingCycle: BillingCycle.MONTHLY,
    credits: 0,
    features: [{ name: '', description: '' }],
    savingsPercentage: undefined,
    isActive: true,
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPlan(prev => {
      const newPlan = { ...prev };
      const fieldName = name as keyof Partial<Plan>;

      if (fieldName === 'price' || fieldName === 'credits' || fieldName === 'order' || fieldName === 'originalPrice' || fieldName === 'savingsPercentage') {
        newPlan[fieldName] = value === '' ? undefined : Number(value);
      } else {
        newPlan[fieldName] = value as any;
      }

      // Calculate price if originalPrice or savingsPercentage changes
      if (fieldName === 'originalPrice' || fieldName === 'savingsPercentage') {
        const originalPrice = newPlan.originalPrice !== undefined ? Number(newPlan.originalPrice) : undefined;
        const savingsPercentage = newPlan.savingsPercentage !== undefined ? Number(newPlan.savingsPercentage) : undefined;

        if (originalPrice !== undefined) {
          if (savingsPercentage !== undefined && savingsPercentage >= 0 && savingsPercentage <= 100) {
            newPlan.price = originalPrice * (1 - savingsPercentage / 100);
          } else {
            newPlan.price = originalPrice;
          }
        } else if (newPlan.price === undefined) {
          newPlan.price = 0; // Default price if originalPrice is not set
        }
      }
      return newPlan;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setPlan(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFeatures = [...(plan.features || [])];
    newFeatures[index] = { ...newFeatures[index], [name]: name === 'limit' ? Number(value) : value };
    setPlan(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setPlan(prev => ({
      ...prev,
      features: [...(prev.features || []), { name: '', description: '' }],
    }));
  };

  const removeFeature = (index: number) => {
    setPlan(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!plan.name || !plan.price || !plan.billingCycle || !plan.credits || !plan.currency) {
        throw new Error('Please fill in all required fields: Name, Price, Billing Cycle, Credits, Currency.');
      }
      if (plan.price <= 0 || plan.credits < 0) {
        throw new Error('Price must be positive and Credits must be non-negative.');
      }
      if (plan.features && plan.features.some(f => !f.name || !f.description)) {
        throw new Error('All feature names and descriptions must be filled.');
      }

      const generatedId = `plan_${plan.type?.toLowerCase()}_${plan.billingCycle?.toLowerCase()}`;
      const planWithId = { ...plan, id: generatedId } as Plan;
      const newPlan = await planService.createPlan(planWithId);
      console.log('Plan created successfully:', newPlan);
      router.push('/dashboard/plans'); // Navigate back to plans list
    } catch (err: any) {
      console.error('Error creating plan:', err);
      setError(err.message || 'Failed to create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Create New Subscription Plan</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input id="name" name="name" value={plan.name} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="type">Plan Type</Label>
                  <Select value={plan.type} onValueChange={(value: PlanType) => handleSelectChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={plan.description} onChange={handleChange} rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input id="originalPrice" name="originalPrice" type="number" value={plan.originalPrice || ''} onChange={handleChange} placeholder="Optional" />
                </div>
                <div>
                  <Label htmlFor="savingsPercentage">Savings Percentage</Label>
                  <Input id="savingsPercentage" name="savingsPercentage" type="number" value={plan.savingsPercentage || ''} onChange={handleChange} placeholder="Optional" />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" value={plan.price} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" value={plan.currency} onChange={handleChange} required disabled />
                </div>
                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select value={plan.billingCycle} onValueChange={(value: BillingCycle) => handleSelectChange('billingCycle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BillingCycle.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={BillingCycle.QUARTERLY}>Quarterly</SelectItem>
                      <SelectItem value={BillingCycle.ANNUAL}>Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" name="credits" type="number" value={plan.credits} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input id="order" name="order" type="number" value={plan.order} onChange={handleChange} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                {plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-end gap-2 mb-3">
                    <div className="flex-1">
                      <Label htmlFor={`feature-name-${index}`}>Feature Name</Label>
                      <Input
                        id={`feature-name-${index}`}
                        name="name"
                        value={feature.name}
                        onChange={(e) => handleFeatureChange(index, e)}
                        placeholder="e.g., Unlimited API Calls"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`feature-description-${index}`}>Description</Label>
                      <Input
                        id={`feature-description-${index}`}
                        name="description"
                        value={feature.description}
                        onChange={(e) => handleFeatureChange(index, e)}
                        placeholder="e.g., Access to all API endpoints without limits"
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`feature-limit-${index}`}>Limit</Label>
                      <Input
                        id={`feature-limit-${index}`}
                        name="limit"
                        type="number"
                        value={feature.limit || ''}
                        onChange={(e) => handleFeatureChange(index, e)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`feature-icon-${index}`}>Icon</Label>
                      <Input
                        id={`feature-icon-${index}`}
                        name="icon"
                        value={feature.icon || ''}
                        onChange={(e) => handleFeatureChange(index, e)}
                        placeholder="Optional"
                      />
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeFeature(index)}>
                      <MinusCircle className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFeature}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Feature
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/plans')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
