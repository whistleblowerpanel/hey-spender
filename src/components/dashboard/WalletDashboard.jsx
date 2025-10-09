import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { format } from 'date-fns';

const WalletDashboard = ({ onRequestPayout, onAddBankDetails }) => {
  const { wallet, transactions, loading } = useWallet();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200"></div>
            <div className="h-48 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'credit') return ArrowDownLeft;
    if (transaction.type === 'debit') return ArrowUpRight;
    return DollarSign;
  };

  const getTransactionColor = (transaction) => {
    if (transaction.type === 'credit') return 'text-green-600';
    if (transaction.type === 'debit') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {formatAmount(wallet?.balance)}
          </div>
          <div className="text-sm opacity-90">
            Available for withdrawal
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRequestPayout}
              disabled={!wallet?.balance || wallet.balance <= 0}
              className="bg-white text-brand-purple hover:bg-gray-100"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddBankDetails}
              className="border-white text-white hover:bg-white hover:text-brand-purple"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add Bank Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                transactions
                  ?.filter(t => t.type === 'credit' && t.status === 'success')
                  ?.reduce((sum, t) => sum + (t.amount || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              From all contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                transactions
                  ?.filter(t => t.type === 'debit' && t.status === 'success')
                  ?.reduce((sum, t) => sum + (t.amount || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Payouts processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <History className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                transactions
                  ?.filter(t => t.type === 'debit' && t.status === 'pending')
                  ?.reduce((sum, t) => sum + (t.amount || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500">Your transaction history will appear here once you start receiving contributions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.slice(0, 10).map((transaction) => {
                const Icon = getTransactionIcon(transaction);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Icon className={`w-4 h-4 ${getTransactionColor(transaction)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description || 'Transaction'}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionColor(transaction)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </div>
                      <Badge 
                        variant={transaction.status === 'success' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onAddBankDetails}
              className="h-20 flex-col gap-2"
            >
              <CreditCard className="w-6 h-6" />
              <span>Manage Bank Details</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {/* TODO: Add transaction history view */}}
              className="h-20 flex-col gap-2"
            >
              <History className="w-6 h-6" />
              <span>View Full History</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDashboard;
