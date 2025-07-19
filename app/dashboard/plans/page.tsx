'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plan, planService, BillingCycle } from '@/lib/planService';
import { Plus, RefreshCw, Search, Filter, Eye, Edit, Trash, Sun, Moon, MoreHorizontal, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PlanDetailsModal } from '@/components/ui/plan-details-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FeaturesModal } from '@/components/ui/features-modal';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('order');
  const [activeBillingCycle, setActiveBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const { theme, setTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState<Plan | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const fetchedPlans = await planService.getAllPlans();
      setPlans(fetchedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleViewFeatures = (plan: Plan) => {
    setSelectedPlanForFeatures(plan);
    setIsFeaturesModalOpen(true);
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
      try {
        await planService.deletePlan(plan.id!);
        loadPlans(); // Reload plans after deletion
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan');
      }
    }
  };

  const getFilteredAndSortedPlans = () => {
    return plans
      .filter(plan => {
        const matchesBillingCycle = plan.billingCycle === activeBillingCycle;
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || plan.type === filterType;
        return matchesBillingCycle && matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'order':
          default:
            return (a.order || 0) - (b.order || 0);
        }
      });
  };

  const filteredPlans = getFilteredAndSortedPlans();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
            <p className="text-muted-foreground mt-2">Manage your subscription plans and billing cycles.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button onClick={loadPlans} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/dashboard/plans/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Plan
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by plan name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-card"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48 bg-card">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Default Order</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Plans Table */}
        <Card>
          <Tabs value={activeBillingCycle} onValueChange={(value) => setActiveBillingCycle(value as BillingCycle)} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-md">
                <TabsTrigger value={BillingCycle.MONTHLY} className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Monthly</TabsTrigger>
                <TabsTrigger value={BillingCycle.QUARTERLY} className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Quarterly</TabsTrigger>
                <TabsTrigger value={BillingCycle.ANNUAL} className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Annual</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="mt-6">
              {loading ? (
                <div className="text-center py-16">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Loading plans...</p>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-muted-foreground text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No plans available</h3>
                  <p className="text-muted-foreground mb-6">
                    {plans.filter(p => p.billingCycle === activeBillingCycle).length === 0 
                      ? `No ${activeBillingCycle.toLowerCase()} plans have been created yet` 
                      : 'No plans match the current search criteria'
                    }
                  </p>
                  {plans.filter(p => p.billingCycle === activeBillingCycle).length === 0 && (
                    <Button onClick={() => router.push('/dashboard/plans/create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create first {activeBillingCycle.toLowerCase()} plan
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Billing Cycle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>
                          <div className="text-right">Actions</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{plan.name}</span>
                              
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {plan.originalPrice && plan.originalPrice > plan.price ? (
                                <>
                                  <span className="line-through text-muted-foreground">
                                    {plan.currency}{plan.originalPrice}
                                  </span>
                                  <span className="font-bold text-primary">{plan.currency}{plan.price}</span>
                                </>
                              ) : (
                                <span>{plan.currency}{plan.price}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{plan.billingCycle}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.type === 'premium' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {plan.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPlan(plan)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewFeatures(plan)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Features
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/plans/edit/${plan.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeletePlan(plan)} className="text-destructive" disabled={true}>
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
      <PlanDetailsModal plan={selectedPlan} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <FeaturesModal plan={selectedPlanForFeatures} isOpen={isFeaturesModalOpen} onClose={() => setIsFeaturesModalOpen(false)} />
    </div>
  );
}

