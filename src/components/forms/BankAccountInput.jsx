import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNigerianBanks } from '@/lib/resolveFieldBehavior';

/**
 * Bank account input with Paystack verification
 * Verifies account number and displays account name
 */
const BankAccountInput = ({
  accountNumber,
  bankCode,
  onAccountChange,
  onBankChange,
  onVerified,
  className,
  disabled,
  ...props
}) => {
  const [banks, setBanks] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  // Load banks on mount
  useEffect(() => {
    getNigerianBanks().then(setBanks);
  }, []);

  // Debounced verification
  useEffect(() => {
    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
      setVerificationResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      await verifyAccount();
    }, 600);

    return () => clearTimeout(timer);
  }, [accountNumber, bankCode]);

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // TODO: Implement actual Paystack verification
      // const response = await fetch('/api/verify-account', {
      //   method: 'POST',
      //   body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
      // });
      // const data = await response.json();
      
      // Mock verification for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResult = {
        account_name: 'John Doe',
        account_number: accountNumber,
      };

      setVerificationResult(mockResult);
      if (onVerified) {
        onVerified(mockResult);
      }
    } catch (err) {
      setError('Unable to verify account. Please check your details.');
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    onAccountChange?.(value);
    setVerificationResult(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Bank Selection */}
      <div>
        <Label htmlFor="bank-select">Bank Name</Label>
        <Select value={bankCode} onValueChange={onBankChange} disabled={disabled}>
          <SelectTrigger id="bank-select" className="mt-2 border-2 border-black">
            <SelectValue placeholder="Select a bank" />
          </SelectTrigger>
          <SelectContent>
            {banks.map((bank) => (
              <SelectItem key={bank.code} value={bank.code}>
                {bank.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account Number */}
      <div>
        <Label htmlFor="account-number">Account Number</Label>
        <div className="relative mt-2">
          <Input
            id="account-number"
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={handleAccountNumberChange}
            disabled={disabled || !bankCode}
            placeholder="0123456789"
            maxLength={10}
            className={cn(
              'pr-10 border-2 border-black',
              verificationResult && 'border-green-500',
              error && 'border-red-500'
            )}
            {...props}
          />
          
          {/* Verification Status Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {verifying && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {verificationResult && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {error && <AlertCircle className="w-4 h-4 text-red-600" />}
          </div>
        </div>

        {/* Account Name Display */}
        {verificationResult && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-900">
              {verificationResult.account_name}
            </p>
            <p className="text-xs text-green-700">Account verified successfully</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {/* Help Text */}
        {!verificationResult && !error && bankCode && accountNumber.length < 10 && (
          <p className="mt-2 text-xs text-gray-500">
            Enter your 10-digit account number
          </p>
        )}
      </div>
    </div>
  );
};

export default BankAccountInput;

