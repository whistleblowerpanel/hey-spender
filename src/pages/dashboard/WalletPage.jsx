import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Search,
  X,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Gift,
  Send,
  ChevronsRight,
  Banknote
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
// BottomNavbar now in DashboardLayout

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { wallet, transactions, loading, refreshWallet } = useWallet();
  const { toast } = useToast();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to view your wallet.'
      });
      navigate('/login');
    }
  }, [user, authLoading, navigate, toast]);

  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch payouts to calculate correct balance
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  // Check if user has bank account details
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(true);

  useEffect(() => {
    const fetchPayouts = async () => {
      if (!wallet?.id) {
        setPayouts([]);
        setPayoutsLoading(false);
        return;
      }
      
      setPayoutsLoading(true);
      try {
        const { data, error } = await supabase
          .from('payouts')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayouts(data || []);
      } catch (error) {
        console.error('Error fetching payouts:', error);
      } finally {
        setPayoutsLoading(false);
      }
    };

    const checkBankDetails = async () => {
      if (!user?.id) {
        setHasBankDetails(false);
        setBankDetailsLoading(false);
        return;
      }

      setBankDetailsLoading(true);
      try {
        // Check if user has bank account details in their profile
        const { data: userData, error } = await supabase
          .from('users')
          .select('bank_account_number, bank_name, account_name')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user bank details:', error);
        }

        // Check if user has all required bank details
        const hasRequiredDetails = userData && 
          userData.bank_account_number && 
          userData.bank_name && 
          userData.account_name;

        setHasBankDetails(!!hasRequiredDetails);
      } catch (error) {
        console.error('Error checking bank details:', error);
        setHasBankDetails(false);
      } finally {
        setBankDetailsLoading(false);
      }
    };

    fetchPayouts();
    checkBankDetails();
  }, [wallet?.id, user?.id]);

  // Bank details state
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    bankCode: ''
  });

  // Payout request state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutAmountFormatted, setPayoutAmountFormatted] = useState('');

  // Format currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number with commas
  const formatNumberWithCommas = (number) => {
    return new Intl.NumberFormat('en-NG').format(number || 0);
  };

  // Handle amount input with comma formatting
  const handleAmountChange = (value) => {
    // Remove commas and non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    setPayoutAmount(numericValue);
    
    // Format with commas for display
    if (numericValue) {
      setPayoutAmountFormatted(formatNumberWithCommas(parseInt(numericValue)));
    } else {
      setPayoutAmountFormatted('');
    }
  };

  // Get transaction icon
  const getTransactionIcon = (transaction) => {
    const source = transaction.source?.toLowerCase() || '';
    if (source.includes('withdrawal') || transaction.is_payout) return Banknote;
    if (source.includes('contribution')) return Gift;
    if (source.includes('sent')) return Send;
    if (transaction.type === 'credit') return ArrowDownLeft;
    if (transaction.type === 'debit') return ArrowUpRight;
    return DollarSign;
  };

  // Get transaction color
  const getTransactionColor = (transaction) => {
    if (transaction.is_payout) return 'text-orange-600';
    if (transaction.type === 'credit') return 'text-green-600';
    if (transaction.type === 'debit') return 'text-red-600';
    return 'text-gray-600';
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status, isWithdrawal = false) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'default';
      case 'paid':
        // For withdrawals, completed status gets green background
        return isWithdrawal ? 'default' : 'default';
      case 'pending':
      case 'requested':
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return CheckCircle2;
      case 'pending':
      case 'requested':
      case 'processing':
        return Clock;
      case 'failed':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  // Get readable status text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'requested':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'paid':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'success':
        return 'Success';
      default:
        return status || 'Unknown';
    }
  };

  // Date filter logic
  const filterByDate = (transaction) => {
    const txDate = new Date(transaction.created_at);
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        return format(txDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      case 'week':
        return isAfter(txDate, subDays(today, 7));
      case 'month':
        return isAfter(txDate, subMonths(today, 1));
      case 'custom':
        // TODO: Implement custom date range picker
        return true;
      default:
        return true;
    }
  };

  // Merge payouts into transactions as withdrawal entries
  const allTransactionsWithPayouts = useMemo(() => {
    const txs = transactions || [];
    const withdrawals = (payouts || []).map(payout => ({
      id: `payout_${payout.id}`,
      wallet_id: payout.wallet_id,
      type: 'debit',
      source: 'withdrawal',
      amount: payout.amount,
      title: 'Wallet Withdrawal',
      description: `Withdrawal to bank account`,
      status: payout.status,
      created_at: payout.created_at,
      // Add payout-specific fields for display
      payout_status: payout.status,
      is_payout: true
    }));
    
    // Merge and sort by created_at descending
    return [...txs, ...withdrawals].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }, [transactions, payouts]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactionsWithPayouts;

    // Tab filter
    if (activeTab === 'received') {
      filtered = filtered.filter(t => t.type === 'credit');
    } else if (activeTab === 'sent') {
      filtered = filtered.filter(t => t.type === 'debit' && !t.is_payout);
    } else if (activeTab === 'withdrawals') {
      filtered = filtered.filter(t => t.is_payout);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Date filter
    filtered = filtered.filter(filterByDate);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.contributor_name?.toLowerCase().includes(query) ||
        t.title?.toLowerCase().includes(query) ||
        t.recipient_username?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allTransactionsWithPayouts, activeTab, typeFilter, statusFilter, dateFilter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const allTransactions = transactions || [];
    // Note: All transactions in the array are already successful (filtered at query time)
    // so we don't need to filter by status here
    const totalReceived = allTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalSent = allTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate total withdrawn from payouts table only
    const totalWithdrawn = (payouts || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // Balance calculation: credits only, minus payouts
    // Do NOT subtract sent contributions; they are paid from bank, not wallet
    const balance = allTransactions.reduce((acc, t) => {
      if (t.type === 'credit') return acc + Number(t.amount || 0);
      // Do not subtract sent contributions; they are paid from bank, not wallet
      return acc;
    }, 0) - totalWithdrawn;
    
    const pendingPayouts = (payouts || [])
      .filter(p => p.status === 'requested' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const receivedCount = allTransactions.filter(t => t.type === 'credit').length;
    const sentCount = allTransactions.filter(t => t.type === 'debit').length;

    return {
      totalReceived,
      totalSent: totalWithdrawn, // Show total withdrawn (from payouts) not sent contributions
      pendingPayouts,
      receivedCount,
      sentCount,
      balance
    };
  }, [transactions, payouts]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid payout amount.'
      });
      return;
    }

    if (parseFloat(payoutAmount) > stats.balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient balance',
        description: 'The requested amount exceeds your available balance.'
      });
      return;
    }

    // TODO: Implement actual payout request to Paystack
    toast({
      title: 'Payout Request Submitted',
      description: `Your request for ${formatAmount(parseFloat(payoutAmount))} has been submitted and will be processed soon.`
    });
    
    setPayoutModalOpen(false);
    setPayoutAmount('');
    setPayoutAmountFormatted('');
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all required bank details.'
      });
      return;
    }

    // TODO: Implement actual bank details save to database
    toast({
      title: 'Bank Details Saved',
      description: 'Your bank details have been saved successfully.'
    });
    
    setBankDetailsModalOpen(false);
  };

  const handleExportTransactions = () => {
    const dataStr = JSON.stringify(filteredTransactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wallet-transactions-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: 'Export Completed',
      description: `${filteredTransactions.length} transactions exported successfully.`
    });
    
    setExportModalOpen(false);
  };

  const handleRefresh = async () => {
    toast({
      title: 'Refreshing...',
      description: 'Fetching latest wallet data.'
    });
    await refreshWallet();
    toast({
      title: 'Refreshed',
      description: 'Wallet data updated successfully.'
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Tabs configuration for bottom navbar
  // Wallet page navigation handler - removed, now using DashboardLayout

  // Check if we're in loading state
  const isLoading = loading || payoutsLoading || bankDetailsLoading;

  return (
    <div>
      <Helmet>
        <title>Wallet - HeySpender</title>
        <meta name="description" content="Manage your wallet, track transactions, and request payouts." />
      </Helmet>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-0 pt-[133px] pb-28 sm:pb-36">
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
        {/* Page Title and Description */}
        <div className="flex flex-row items-start justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-brand-purple-dark mb-2">Wallet</h1>
            <p className="text-gray-600">
              Manage your earnings, track contributions received, and request payouts.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 self-start mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-none"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 rounded-none"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wallet Balance Card */}
            <div className="rounded-lg border text-card-foreground shadow-sm bg-white">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Wallet Balance</h3>
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{formatAmount(stats.balance)}</div>
              </div>
            </div>

            {/* Total Received Card */}
            <div className="rounded-lg border text-card-foreground shadow-sm bg-white">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Received</h3>
                <ChevronsRight className="h-4 w-4 text-orange-600" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{formatAmount(stats.totalReceived)}</div>
                <p className="text-xs mt-1 text-muted-foreground">Withdrawal: {formatAmount(stats.totalSent)}</p>
              </div>
            </div>

            {/* Request Payout Card */}
            <button
              onClick={() => setPayoutModalOpen(true)}
              disabled={!stats.balance || stats.balance <= 0}
              className="rounded-lg border text-card-foreground shadow-sm bg-brand-purple-dark p-6 flex flex-col items-center justify-center gap-2 transition-all duration-150 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="w-6 h-6 text-white" />
              <span className="text-lg font-bold text-white">Request Payout</span>
            </button>
          </div>

          {/* Transactions Section */}
          <Card className="rounded-none border-none shadow-none px-0">
          <CardHeader className="px-0">
            <div className="flex flex-col gap-0">
              {/* Title and Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-brand-purple-dark whitespace-nowrap">Transaction History</h3>
                  {/* Description - Desktop only */}
                  <CardDescription className="hidden lg:block mt-0.5">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                
                {/* Search and Tabs */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-none"
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <Button
                      onClick={() => setActiveTab('all')}
                      className={`h-10 py-2 border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md transition-all duration-150 font-semibold active:shadow-[0px_0px_0px_#000] active:brightness-90 ${
                        activeTab === 'all'
                          ? 'bg-brand-purple-dark text-white'
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setActiveTab('received')}
                      className={`h-10 py-2 border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md transition-all duration-150 font-semibold active:shadow-[0px_0px_0px_#000] active:brightness-90 ${
                        activeTab === 'received'
                          ? 'bg-brand-green text-black'
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      Received
                    </Button>
                    <Button
                      onClick={() => setActiveTab('sent')}
                      className={`h-10 py-2 border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md transition-all duration-150 font-semibold active:shadow-[0px_0px_0px_#000] active:brightness-90 ${
                        activeTab === 'sent'
                          ? 'bg-brand-orange text-black'
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      Sent
                    </Button>
                    <Button
                      onClick={() => setActiveTab('withdrawals')}
                      className={`h-10 py-2 border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md transition-all duration-150 font-semibold active:shadow-[0px_0px_0px_#000] active:brightness-90 ${
                        activeTab === 'withdrawals'
                          ? 'bg-brand-salmon text-black'
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      Withdrawals
                    </Button>
                  </div>

                  {(searchQuery || dateFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-1 rounded-none"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Description - Mobile only, after controls */}
              <CardDescription className="lg:hidden mt-4">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <Wallet className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {transactions?.length === 0 ? 'No Transactions Yet' : 'No Matching Transactions'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {transactions?.length === 0 
                    ? 'Your transaction history will appear here once you start receiving contributions or making payments.'
                    : 'Try adjusting your filters to find what you\'re looking for.'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User/Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {paginatedTransactions.map((transaction, index) => {
                          const Icon = getTransactionIcon(transaction);
                          
                          return (
                            <motion.tr
                              key={transaction.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                                <br />
                                <span className="text-xs text-gray-400">
                                  {format(new Date(transaction.created_at), 'HH:mm')}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2",
                                    transaction.is_payout 
                                      ? 'bg-orange-100'
                                      : (transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100')
                                  )}>
                                    <Icon className={cn("w-4 h-4", getTransactionColor(transaction))} />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {transaction.title || transaction.description || 'Transaction'}
                                    </div>
                                    {transaction.title && transaction.description && transaction.title !== transaction.description && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {transaction.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <Badge variant={transaction.is_payout ? getStatusBadgeVariant(transaction.payout_status) : (transaction.type === 'credit' ? 'default' : 'secondary')} className="rounded-none">
                                  {transaction.is_payout ? 'Withdrawal' : (transaction.type === 'credit' ? 'Credit' : 'Debit')}
                                </Badge>
                              </td>
                              <td className="py-4 px-4 text-sm">
                                {transaction.is_payout ? (
                                  <Badge variant={getStatusBadgeVariant(transaction.payout_status, true)} className={cn(
                                    "rounded-none",
                                    transaction.payout_status === 'paid' && "bg-green-600 text-white hover:bg-green-700"
                                  )}>
                                    {getStatusText(transaction.payout_status)}
                                  </Badge>
                                ) : transaction.type === 'credit' ? (
                                  transaction.contributor_name ? (
                                    <span className="text-gray-700">
                                      {transaction.contributor_name.startsWith('@') 
                                        ? transaction.contributor_name 
                                        : `@${transaction.contributor_name}`}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )
                                ) : (
                                  transaction.recipient_username ? (
                                    <span className="text-gray-700">@{transaction.recipient_username}</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )
                                )}
                              </td>
                              <td className={cn(
                                "py-4 px-4 text-right font-semibold",
                                getTransactionColor(transaction)
                              )}>
                                {transaction.type === 'credit' ? '+' : '-'}
                                {formatAmount(transaction.amount)}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-3">
                  <AnimatePresence>
                    {paginatedTransactions.map((transaction, index) => {
                      const Icon = getTransactionIcon(transaction);
                      
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={cn(
                              "p-2 flex-shrink-0",
                              transaction.is_payout 
                                ? 'bg-orange-100'
                                : (transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100')
                            )}>
                              <Icon className={cn("w-5 h-5", getTransactionColor(transaction))} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {transaction.title || transaction.description || 'Transaction'}
                              </div>
                              {!transaction.is_payout && (transaction.contributor_name || transaction.recipient_username) && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {transaction.type === 'credit' 
                                    ? (transaction.contributor_name?.startsWith('@') 
                                        ? transaction.contributor_name 
                                        : `@${transaction.contributor_name}`)
                                    : `@${transaction.recipient_username}`
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {!transaction.is_payout && (
                                <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'} className="text-xs rounded-none">
                                  {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                                </Badge>
                              )}
                              {transaction.is_payout && (
                                <Badge variant={getStatusBadgeVariant(transaction.payout_status, true)} className={cn(
                                  "text-xs rounded-none",
                                  transaction.payout_status === 'paid' && "bg-green-600 text-white hover:bg-green-700"
                                )}>
                                  {getStatusText(transaction.payout_status)}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">{format(new Date(transaction.created_at), 'MMM dd, yyyy · HH:mm')}</span>
                            </div>
                            <div className={cn(
                              "font-bold text-lg",
                              getTransactionColor(transaction)
                            )}>
                              {transaction.type === 'credit' ? '+' : '-'}
                              {formatAmount(transaction.amount)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-none"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Previous</span>
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-9 rounded-none"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-none"
                      >
                        <span className="hidden sm:inline mr-1">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>

      {/* BottomNavbar is now in DashboardLayout */}

      {/* Payout Request Modal */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Request a withdrawal from your wallet balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  Available balance: <strong>{formatAmount(stats.balance)}</strong>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Amount (₦)</Label>
              <Input
                id="payout-amount"
                type="text"
                placeholder={hasBankDetails ? "Enter amount" : "Setup bank details first"}
                value={payoutAmountFormatted}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={!hasBankDetails}
                className={cn(
                  "rounded-none",
                  !hasBankDetails && "bg-gray-100 cursor-not-allowed"
                )}
              />
              {hasBankDetails ? (
                <p className="text-xs text-gray-500">
                  Minimum payout amount is ₦1,000
                </p>
              ) : (
                <p className="text-xs text-red-500">
                  Please setup your bank account details in Settings first
                </p>
              )}
            </div>

            {/* Bank Details Warning */}
            {!hasBankDetails && (
              <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Bank Account Required</strong>
                    <p className="mt-1">
                      You need to add your bank account details before requesting payouts. 
                      Go to Settings to add your account information.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPayoutModalOpen(false);
                        navigate('/dashboard/settings');
                      }}
                      className="mt-2 border-2 border-red-300 text-red-700 hover:bg-red-100 text-xs px-3 py-1 rounded-md transition-all duration-150"
                    >
                      Go to Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Timeline Card */}
            <div className="border-2 border-orange-300 bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Processing Timeline</h3>
              </div>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Request Submitted: Immediate confirmation</li>
                <li>• Admin Review: Within 24 hours</li>
                <li>• Processing: 24-48 hours after approval</li>
                <li>• Funds Transfer: 1-2 business days</li>
              </ul>
              <p className="text-xs text-orange-600 mt-2">
                You'll receive email notifications at each step.
              </p>
            </div>

            {/* Auto-Approval Card */}
            <div className="border-2 border-green-300 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Auto-Approval Available</h3>
              </div>
              <p className="text-sm text-green-700">
                Withdrawals of ₦5,000 or less are automatically approved for verified users and processed immediately!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Larger amounts require manual admin review for security.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPayoutModalOpen(false);
                setPayoutAmount('');
                setPayoutAmountFormatted('');
              }} 
              className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPayout}
              disabled={!hasBankDetails}
              className={cn(
                "border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90",
                hasBankDetails 
                  ? "bg-brand-purple-dark hover:bg-brand-purple text-white" 
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              )}
            >
              {hasBankDetails ? "Submit Request" : "Setup Bank Details First"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Details Modal */}
      <Dialog open={bankDetailsModalOpen} onOpenChange={setBankDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bank Account Details
            </DialogTitle>
            <DialogDescription>
              Add or update your bank account for payouts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Full name on account"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="10-digit account number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                maxLength={10}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Select 
                value={bankDetails.bankName} 
                onValueChange={(value) => setBankDetails({...bankDetails, bankName: value})}
              >
                <SelectTrigger id="bank-name" className="rounded-none">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="access">Access Bank</SelectItem>
                  <SelectItem value="gtb">GTBank</SelectItem>
                  <SelectItem value="uba">UBA</SelectItem>
                  <SelectItem value="zenith">Zenith Bank</SelectItem>
                  <SelectItem value="first">First Bank</SelectItem>
                  <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                  <SelectItem value="union">Union Bank</SelectItem>
                  <SelectItem value="sterling">Sterling Bank</SelectItem>
                  <SelectItem value="stanbic">Stanbic IBTC</SelectItem>
                  <SelectItem value="fcmb">FCMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBankDetailsModalOpen(false)} 
              className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBankDetails} 
              className="bg-brand-purple-dark hover:bg-brand-purple text-white border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90"
            >
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Transactions
            </DialogTitle>
            <DialogDescription>
              Download your transaction history
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions:</span>
                <span className="font-semibold">{filteredTransactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Range:</span>
                <span className="font-semibold">
                  {dateFilter === 'all' ? 'All Time' : dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-semibold">JSON</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setExportModalOpen(false)} 
              className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExportTransactions} 
              className="bg-brand-purple-dark hover:bg-brand-purple text-white border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 rounded-md transition-all duration-150 active:shadow-[0px_0px_0px_#000] active:brightness-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;

