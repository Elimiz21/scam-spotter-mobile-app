// Comprehensive payment service with PayPal and Stripe integration
import { loadScript } from '@paypal/paypal-js';
import { appConfig } from '@/config/environment';
import { logger } from '@/lib/logger';
import { supabaseApi } from '@/lib/apiClient';
import { createBadRequestError, createExternalApiError } from '@/lib/errorHandler';
import { validators } from '@/lib/inputValidation';

// Payment types
export type PaymentProvider = 'paypal' | 'stripe' | 'crypto';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing';

// Pricing plans
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  limits: {
    scansPerMonth: number;
    groupsPerMonth: number;
    apiCalls: number;
    exportFormats: string[];
    support: 'community' | 'email' | 'priority' | 'dedicated';
    dataRetention: number; // days
  };
  popular?: boolean;
  discount?: {
    percentage: number;
    validUntil: Date;
  };
}

// Payment interfaces
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank' | 'crypto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

// Usage tracking
export interface UsageRecord {
  userId: string;
  type: 'scan' | 'group_analysis' | 'api_call' | 'export';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PaymentService {
  private paypalClient: any = null;
  private stripeClient: any = null;
  private plans: Map<string, PricingPlan> = new Map();

  constructor() {
    this.initializePlans();
  }

  // Initialize pricing plans
  private initializePlans(): void {
    const plans: PricingPlan[] = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for individuals getting started',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '10 scans per month',
          '2 group analyses per month',
          'Basic scam detection',
          'Email support',
          '7-day data retention',
        ],
        limits: {
          scansPerMonth: 10,
          groupsPerMonth: 2,
          apiCalls: 100,
          exportFormats: ['csv'],
          support: 'community',
          dataRetention: 7,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For professionals and small teams',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited scans',
          '50 group analyses per month',
          'Advanced AI detection',
          'Priority email support',
          'API access',
          '90-day data retention',
          'Custom alerts',
        ],
        limits: {
          scansPerMonth: -1, // unlimited
          groupsPerMonth: 50,
          apiCalls: 10000,
          exportFormats: ['csv', 'pdf', 'json'],
          support: 'email',
          dataRetention: 90,
        },
        popular: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For organizations with advanced needs',
        price: 99.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited everything',
          'Custom AI models',
          'Dedicated support',
          'SLA guarantee',
          'White-label options',
          'Unlimited data retention',
          'Advanced analytics',
          'Team collaboration',
        ],
        limits: {
          scansPerMonth: -1,
          groupsPerMonth: -1,
          apiCalls: -1,
          exportFormats: ['csv', 'pdf', 'json', 'excel', 'api'],
          support: 'dedicated',
          dataRetention: -1,
        },
      },
    ];

    plans.forEach(plan => this.plans.set(plan.id, plan));
  }

  // Initialize PayPal
  async initializePayPal(): Promise<void> {
    if (this.paypalClient) return;

    try {
      this.paypalClient = await loadScript({
        'client-id': appConfig.paypal.clientId,
        currency: 'USD',
        intent: 'subscription',
        vault: true,
        components: 'buttons,funding-eligibility,messages',
      });

      logger.info('PayPal initialized');
    } catch (error) {
      logger.error('Failed to initialize PayPal', { error });
      throw createExternalApiError('PayPal', error as Error);
    }
  }

  // Initialize Stripe
  async initializeStripe(): Promise<void> {
    if (this.stripeClient) return;

    try {
      // Dynamically import Stripe
      const { loadStripe } = await import('@stripe/stripe-js');
      
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripeKey) {
        throw new Error('Stripe publishable key not configured');
      }

      this.stripeClient = await loadStripe(stripeKey);

      logger.info('Stripe initialized');
    } catch (error) {
      logger.error('Failed to initialize Stripe', { error });
      throw createExternalApiError('Stripe', error as Error);
    }
  }

  // Get pricing plans
  getPricingPlans(): PricingPlan[] {
    return Array.from(this.plans.values());
  }

  // Get specific plan
  getPlan(planId: string): PricingPlan | undefined {
    return this.plans.get(planId);
  }

  // Create payment intent
  async createPaymentIntent(
    amount: number,
    currency: string = 'USD',
    provider: PaymentProvider = 'stripe',
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    try {
      // Validate amount
      if (amount <= 0) {
        throw createBadRequestError('Invalid payment amount');
      }

      // Call backend to create payment intent
      const { data, error } = await supabaseApi.callFunction('create-payment-intent', {
        amount,
        currency,
        provider,
        metadata,
      });

      if (error) {
        throw error;
      }

      logger.info('Payment intent created', {
        provider,
        amount,
        currency,
      });

      return data as PaymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent', { error });
      throw error;
    }
  }

  // Process one-time payment
  async processPayment(
    paymentIntentId: string,
    paymentMethod: any,
    provider: PaymentProvider = 'stripe'
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      if (provider === 'stripe') {
        return await this.processStripePayment(paymentIntentId, paymentMethod);
      } else if (provider === 'paypal') {
        return await this.processPayPalPayment(paymentIntentId, paymentMethod);
      } else {
        throw createBadRequestError(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Payment processing failed', { error, provider });
      throw error;
    }
  }

  // Process Stripe payment
  private async processStripePayment(
    paymentIntentId: string,
    paymentMethod: any
  ): Promise<{ success: boolean; transactionId?: string }> {
    if (!this.stripeClient) {
      await this.initializeStripe();
    }

    const { error, paymentIntent } = await this.stripeClient.confirmCardPayment(
      paymentIntentId,
      {
        payment_method: paymentMethod,
      }
    );

    if (error) {
      logger.error('Stripe payment failed', { error });
      throw createExternalApiError('Stripe', new Error(error.message));
    }

    // Verify payment on backend
    const { data } = await supabaseApi.callFunction('verify-payment', {
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
    });

    return {
      success: true,
      transactionId: paymentIntent.id,
    };
  }

  // Process PayPal payment
  private async processPayPalPayment(
    orderId: string,
    paymentMethod: any
  ): Promise<{ success: boolean; transactionId?: string }> {
    if (!this.paypalClient) {
      await this.initializePayPal();
    }

    // Capture PayPal order
    const { data, error } = await supabaseApi.callFunction('capture-paypal-order', {
      orderId,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      transactionId: data.transactionId,
    };
  }

  // Create subscription
  async createSubscription(
    planId: string,
    provider: PaymentProvider = 'stripe',
    paymentMethod?: any
  ): Promise<Subscription> {
    try {
      const plan = this.getPlan(planId);
      
      if (!plan) {
        throw createBadRequestError('Invalid plan selected');
      }

      // Call backend to create subscription
      const { data, error } = await supabaseApi.callFunction('create-subscription', {
        planId,
        provider,
        paymentMethod,
      });

      if (error) {
        throw error;
      }

      logger.info('Subscription created', { planId, provider });

      return data as Subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error });
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<Subscription> {
    try {
      const { data, error } = await supabaseApi.callFunction('update-subscription', {
        subscriptionId,
        ...updates,
      });

      if (error) {
        throw error;
      }

      logger.info('Subscription updated', { subscriptionId, updates });

      return data as Subscription;
    } catch (error) {
      logger.error('Failed to update subscription', { error });
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      const { error } = await supabaseApi.callFunction('cancel-subscription', {
        subscriptionId,
        immediately,
      });

      if (error) {
        throw error;
      }

      logger.info('Subscription cancelled', { subscriptionId, immediately });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error });
      throw error;
    }
  }

  // Get user's subscription
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabaseApi.callFunction('get-user-subscription', {
        userId,
      });

      if (error) {
        throw error;
      }

      return data as Subscription | null;
    } catch (error) {
      logger.error('Failed to get user subscription', { error });
      return null;
    }
  }

  // Get payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabaseApi.callFunction('get-payment-methods', {
        userId,
      });

      if (error) {
        throw error;
      }

      return data as PaymentMethod[];
    } catch (error) {
      logger.error('Failed to get payment methods', { error });
      return [];
    }
  }

  // Add payment method
  async addPaymentMethod(
    provider: PaymentProvider,
    paymentMethod: any
  ): Promise<PaymentMethod> {
    try {
      const { data, error } = await supabaseApi.callFunction('add-payment-method', {
        provider,
        paymentMethod,
      });

      if (error) {
        throw error;
      }

      logger.info('Payment method added', { provider });

      return data as PaymentMethod;
    } catch (error) {
      logger.error('Failed to add payment method', { error });
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabaseApi.callFunction('remove-payment-method', {
        paymentMethodId,
      });

      if (error) {
        throw error;
      }

      logger.info('Payment method removed', { paymentMethodId });
    } catch (error) {
      logger.error('Failed to remove payment method', { error });
      throw error;
    }
  }

  // Get invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabaseApi.callFunction('get-invoices', {
        userId,
      });

      if (error) {
        throw error;
      }

      return data as Invoice[];
    } catch (error) {
      logger.error('Failed to get invoices', { error });
      return [];
    }
  }

  // Download invoice
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const { data, error } = await supabaseApi.callFunction('download-invoice', {
        invoiceId,
      });

      if (error) {
        throw error;
      }

      return data as Blob;
    } catch (error) {
      logger.error('Failed to download invoice', { error });
      throw error;
    }
  }

  // Track usage
  async trackUsage(record: UsageRecord): Promise<void> {
    try {
      const { error } = await supabaseApi.callFunction('track-usage', record);

      if (error) {
        throw error;
      }

      logger.debug('Usage tracked', { type: record.type, quantity: record.quantity });
    } catch (error) {
      logger.error('Failed to track usage', { error });
    }
  }

  // Get usage statistics
  async getUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabaseApi.callFunction('get-usage-stats', {
        userId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get usage stats', { error });
      return {};
    }
  }

  // Check feature access
  async checkFeatureAccess(
    userId: string,
    feature: string
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return {
          hasAccess: false,
          reason: 'No active subscription',
        };
      }

      const plan = this.getPlan(subscription.planId);
      
      if (!plan) {
        return {
          hasAccess: false,
          reason: 'Invalid subscription plan',
        };
      }

      // Check specific feature limits
      // This would be more sophisticated in production
      const hasAccess = plan.price > 0 || feature === 'basic';

      return {
        hasAccess,
        reason: hasAccess ? undefined : 'Feature requires Pro or Enterprise plan',
      };
    } catch (error) {
      logger.error('Failed to check feature access', { error });
      
      return {
        hasAccess: false,
        reason: 'Unable to verify access',
      };
    }
  }

  // Apply promo code
  async applyPromoCode(code: string): Promise<{
    valid: boolean;
    discount?: number;
    message?: string;
  }> {
    try {
      const { data, error } = await supabaseApi.callFunction('apply-promo-code', {
        code,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to apply promo code', { error });
      
      return {
        valid: false,
        message: 'Invalid promo code',
      };
    }
  }

  // Calculate pricing
  calculatePricing(
    planId: string,
    interval: 'month' | 'year',
    promoDiscount?: number
  ): {
    basePrice: number;
    discount: number;
    finalPrice: number;
    savings: number;
  } {
    const plan = this.getPlan(planId);
    
    if (!plan) {
      throw createBadRequestError('Invalid plan');
    }

    let basePrice = plan.price;
    
    // Apply annual discount
    if (interval === 'year') {
      basePrice = basePrice * 12 * 0.8; // 20% discount for annual
    }

    // Apply promo discount
    const discount = promoDiscount ? basePrice * (promoDiscount / 100) : 0;
    const finalPrice = basePrice - discount;
    const savings = plan.price * 12 - finalPrice;

    return {
      basePrice,
      discount,
      finalPrice,
      savings: interval === 'year' ? savings : 0,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export types
export type {
  PricingPlan,
  PaymentIntent,
  Subscription,
  Invoice,
  PaymentMethod,
  UsageRecord,
};