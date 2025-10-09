import { supabase } from './customSupabaseClient';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

class PaystackTransferService {
  constructor() {
    this.secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
    if (!this.secretKey) {
      console.error('Paystack secret key not found in environment variables');
    }
  }

  /**
   * Make authenticated request to Paystack API
   */
  async makePaystackRequest(endpoint, options = {}) {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const url = `${PAYSTACK_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Paystack API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a transfer recipient for a user
   */
  async createTransferRecipient(recipientData) {
    const { name, account_number, bank_code } = recipientData;
    
    const payload = {
      type: 'nuban',
      name: name,
      account_number: account_number,
      bank_code: bank_code,
      currency: 'NGN'
    };

    try {
      const response = await this.makePaystackRequest('/transferrecipient', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.status) {
        return {
          success: true,
          recipient_code: response.data.recipient_code,
          data: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to create transfer recipient');
      }
    } catch (error) {
      console.error('Error creating transfer recipient:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initiate a transfer to a recipient
   */
  async initiateTransfer(transferData) {
    const { amount, recipient_code, reference, reason } = transferData;
    
    const payload = {
      source: 'balance',
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: recipient_code,
      reference: reference,
      reason: reason || 'Withdrawal from HeySpender'
    };

    try {
      const response = await this.makePaystackRequest('/transfer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.status) {
        return {
          success: true,
          transfer_code: response.data.transfer_code,
          status: response.data.status,
          data: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to initiate transfer');
      }
    } catch (error) {
      console.error('Error initiating transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Finalize a transfer (if OTP is required)
   */
  async finalizeTransfer(transfer_code, otp) {
    const payload = {
      transfer_code: transfer_code,
      otp: otp
    };

    try {
      const response = await this.makePaystackRequest('/transfer/finalize_transfer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.status) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to finalize transfer');
      }
    } catch (error) {
      console.error('Error finalizing transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify transfer status
   */
  async verifyTransfer(transferId) {
    try {
      const response = await this.makePaystackRequest(`/transfer/${transferId}`);

      if (response.status) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to verify transfer');
      }
    } catch (error) {
      console.error('Error verifying transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of banks for account verification
   */
  async getBanks() {
    try {
      const response = await this.makePaystackRequest('/bank?country=nigeria');
      
      if (response.status) {
        return {
          success: true,
          banks: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to fetch banks');
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify bank account details
   */
  async verifyAccount(account_number, bank_code) {
    try {
      const response = await this.makePaystackRequest(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`);
      
      if (response.status) {
        return {
          success: true,
          account_name: response.data.account_name,
          account_number: response.data.account_number
        };
      } else {
        throw new Error(response.message || 'Failed to verify account');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a complete payout - create recipient if needed and initiate transfer
   */
  async processPayout(payoutData) {
    const { 
      payout_id, 
      amount, 
      destination_account, 
      destination_bank_code, 
      user_name,
      user_email 
    } = payoutData;

    try {
      // First, verify the account details
      const accountVerification = await this.verifyAccount(destination_account, destination_bank_code);
      if (!accountVerification.success) {
        return {
          success: false,
          error: `Account verification failed: ${accountVerification.error}`,
          step: 'account_verification'
        };
      }

      // Create transfer recipient
      const recipientResult = await this.createTransferRecipient({
        name: accountVerification.account_name,
        account_number: destination_account,
        bank_code: destination_bank_code
      });

      if (!recipientResult.success) {
        return {
          success: false,
          error: `Failed to create recipient: ${recipientResult.error}`,
          step: 'create_recipient'
        };
      }

      // Generate unique reference for the transfer
      const transferReference = `payout_${payout_id}_${Date.now()}`;

      // Initiate the transfer
      const transferResult = await this.initiateTransfer({
        amount: amount,
        recipient_code: recipientResult.recipient_code,
        reference: transferReference,
        reason: `Withdrawal for ${user_name} (${user_email})`
      });

      if (!transferResult.success) {
        return {
          success: false,
          error: `Failed to initiate transfer: ${transferResult.error}`,
          step: 'initiate_transfer'
        };
      }

      // Update the payout record with provider information
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          provider: 'paystack',
          provider_ref: transferResult.transfer_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', payout_id);

      if (updateError) {
        console.error('Error updating payout with provider info:', updateError);
        // Don't fail the transfer if we can't update the database
      }

      return {
        success: true,
        transfer_code: transferResult.transfer_code,
        transfer_status: transferResult.status,
        recipient_code: recipientResult.recipient_code,
        transfer_reference: transferReference,
        account_name: accountVerification.account_name,
        requires_otp: transferResult.status === 'otp'
      };

    } catch (error) {
      console.error('Error processing payout:', error);
      return {
        success: false,
        error: error.message,
        step: 'general_error'
      };
    }
  }
}

// Export a singleton instance
export const paystackTransferService = new PaystackTransferService();
export default paystackTransferService;
