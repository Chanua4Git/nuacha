import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DownloadProduct {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_ttd: number;
  features: string[];
  download_file_path?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DownloadPurchaseData {
  productId: string;
  userEmail: string;
  userName?: string;
  paymentMethod: 'paypal' | 'bank_transfer';
}

export const useDownloadPurchase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createPayPalPurchase = async (data: DownloadPurchaseData) => {
    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('create-download-purchase-paypal', {
        body: data
      });

      if (error) {
        console.error('PayPal purchase creation error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to create PayPal order. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return response;
    } catch (error) {
      console.error('Error creating PayPal purchase:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const capturePayPalPurchase = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-download-purchase-paypal', {
        body: { orderId }
      });

      if (error || !data?.success) {
        console.error('PayPal capture error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to complete payment. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Payment Successful",
        description: "Your purchase has been completed successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createBankTransferPurchase = async (data: DownloadPurchaseData) => {
    setIsLoading(true);
    try {
      // Generate order reference
      const orderReference = `GO-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const { error } = await supabase
        .from('download_purchases')
        .insert({
          product_id: data.productId,
          user_email: data.userEmail,
          user_name: data.userName,
          payment_method: 'bank_transfer',
          amount: 1010.62, // TTD price
          currency: 'TTD',
          status: 'pending_bank_transfer',
          order_reference: orderReference,
          download_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) {
        console.error('Bank transfer purchase creation error:', error);
        toast({
          title: "Order Creation Error",
          description: "Failed to create your order. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Order Created",
        description: "Your order has been created. Please complete the bank transfer.",
      });

      return { orderReference };
    } catch (error) {
      console.error('Error creating bank transfer purchase:', error);
      toast({
        title: "Order Creation Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = async (productId: string): Promise<DownloadProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return {
        ...data,
        features: Array.isArray(data.features) ? data.features : []
      } as DownloadProduct;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const getDownloadPurchases = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('download_purchases')
        .select(`
          *,
          products (*)
        `)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching download purchases:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching download purchases:', error);
      return [];
    }
  };

  return {
    createPayPalPurchase,
    capturePayPalPurchase,
    createBankTransferPurchase,
    getProduct,
    getDownloadPurchases,
    isLoading
  };
};