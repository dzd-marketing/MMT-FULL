import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Search, User, Mail, DollarSign, AlertCircle,
  CheckCircle2, XCircle, Loader2, ArrowLeft, ChevronRight,
  Wallet, Users, Clock, Sparkles, Globe
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
}

// Currency symbols
const currencySymbols = {
  USD: '$',
  LKR: 'LKR ',
  INR: '₹'
};

// Custom debounce function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export default function TransferFundsView() {
  const { userData }: any = useOutletContext();
  
  // API URL
    const API_URL = import.meta.env.VITE_API_URL;
  
  // Form states
  const [receiverIdentifier, setReceiverIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<User | null>(null);
  
  // Transfer states
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');
  
  // Balance check
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  
  // Currency states
  const [userCurrency, setUserCurrency] = useState<'USD' | 'LKR' | 'INR'>('LKR');
  const [conversionRates, setConversionRates] = useState({
    usdToLkr: 309.45,
    inrToLkr: 3.37
  });

  // Recent transfers (mock data)
  const [recentTransfers, setRecentTransfers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', amount: '50.00', date: '2 hours ago', status: 'completed' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', amount: '25.00', date: 'Yesterday', status: 'completed' },
  ]);

  // Fetch conversion rates
  useEffect(() => {
    const fetchConversionRates = async () => {
      try {
        const usdToLkrResponse = await axios.get('https://hexarate.paikama.co/api/rates/USD/LKR/latest');
        if (usdToLkrResponse.data?.data?.mid) {
          setConversionRates(prev => ({
            ...prev,
            usdToLkr: usdToLkrResponse.data.data.mid
          }));
        }

        const inrToUsdResponse = await axios.get('https://hexarate.paikama.co/api/rates/INR/USD/latest');
        if (inrToUsdResponse.data?.data?.mid) {
          const inrToUsd = inrToUsdResponse.data.data.mid;
          const usdToLkr = conversionRates.usdToLkr || 309.45;
          const inrToLkr = (1 / inrToUsd) * usdToLkr;
          setConversionRates(prev => ({
            ...prev,
            inrToLkr: inrToLkr
          }));
        }
      } catch (error) {
        console.log('Using default conversion rates');
      }
    };

    fetchConversionRates();
  }, []);

  // Fetch user currency from profile
  const fetchUserCurrency = async () => {
    try {
      const profileResponse = await axios.get(`${API_URL}/user/profiles`, { withCredentials: true });
      if (profileResponse.data.success) {
        const profileUser = profileResponse.data.user;
        if (profileUser.currency) {
          const currencyValue = mapBackendCurrency(profileUser.currency);
          setUserCurrency(currencyValue);
          localStorage.setItem('preferred_currency', currencyValue);
        }
      }
    } catch (error) {
      console.log('Could not fetch currency from profile, using default');
    }
  };

  // Helper function to map backend currency
  const mapBackendCurrency = (backendCurrency: string): 'USD' | 'LKR' | 'INR' => {
    if (backendCurrency === 'USD' || backendCurrency === 'LKR' || backendCurrency === 'INR') {
      return backendCurrency;
    }
    const map = {
      '1': 'USD',
      '2': 'LKR',
      '3': 'INR'
    };
    return (map[backendCurrency as keyof typeof map] || 'LKR') as 'USD' | 'LKR' | 'INR';
  };

  // Listen for currency updates
  useEffect(() => {
    const handleCurrencyUpdate = (event: CustomEvent) => {
      const { currency } = event.detail;
      setUserCurrency(currency);
      localStorage.setItem('preferred_currency', currency);
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate as EventListener);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate as EventListener);
    };
  }, []);

  // Fetch user currency on mount
  useEffect(() => {
    fetchUserCurrency();
  }, []);

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currencySymbols[userCurrency] || 'LKR ';
  };

  // Convert LKR to user's preferred currency
  const convertFromLkr = (amountInLkr: number) => {
    if (userCurrency === 'LKR') {
      return amountInLkr;
    }
    if (userCurrency === 'USD') {
      return amountInLkr / conversionRates.usdToLkr;
    }
    if (userCurrency === 'INR') {
      return amountInLkr / conversionRates.inrToLkr;
    }
    return amountInLkr;
  };

  // Convert user's preferred currency to LKR (for sending to backend)
  const convertToLkr = (amountInUserCurrency: number) => {
    if (userCurrency === 'LKR') {
      return amountInUserCurrency;
    }
    if (userCurrency === 'USD') {
      return amountInUserCurrency * conversionRates.usdToLkr;
    }
    if (userCurrency === 'INR') {
      return amountInUserCurrency * conversionRates.inrToLkr;
    }
    return amountInUserCurrency;
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
  };

  // Debounced search function - FIXED
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await axios.get(`${API_URL}/transfer/search?query=${encodeURIComponent(query)}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setSearchResults(response.data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 500),
    [API_URL]
  );

  // Handle search input
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      setSearchResults([]);
    };
  }, [searchQuery, debouncedSearch]);

  // Check if amount exceeds balance
  useEffect(() => {
    if (amount && userData?.available_balance) {
      const transferAmountInLkr = convertToLkr(parseFloat(amount));
      const currentBalanceInLkr = parseFloat(userData.available_balance);
      setInsufficientBalance(transferAmountInLkr > currentBalanceInLkr);
    } else {
      setInsufficientBalance(false);
    }
  }, [amount, userData, userCurrency, conversionRates]);

  // Handle transfer - FIXED
  const handleTransfer = async () => {
    if (!receiverIdentifier || !amount) {
      setTransferError('Please enter receiver email/username and amount');
      return;
    }

    if (insufficientBalance) {
      setTransferError('Insufficient balance');
      return;
    }

    setTransferring(true);
    setTransferError('');

    try {
      // Convert amount to LKR before sending to backend
      const amountInLkr = convertToLkr(parseFloat(amount)).toFixed(2);

      const response = await axios.post(`${API_URL}/transfer/send`,
        {
          receiverEmail: receiverIdentifier,
          amount: amountInLkr
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setTransferSuccess(true);
        
        setRecentTransfers(prev => [{
          id: Date.now(),
          name: response.data.receiver?.name || 'User',
          email: receiverIdentifier,
          amount: amount,
          date: 'Just now',
          status: 'completed'
        }, ...prev.slice(0, 4)]);

        setTimeout(() => {
          setReceiverIdentifier('');
          setAmount('');
          setSelectedReceiver(null);
          setTransferSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      setTransferError(error.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  // Select user from search
  const selectUser = (user: User) => {
    setReceiverIdentifier(user.email);
    setSelectedReceiver(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Parse amount safely
  const parsedAmount = parseFloat(amount || '0');
  const parsedBalance = parseFloat(userData?.available_balance || '0');
  const convertedBalance = convertFromLkr(parsedBalance);
  const balanceAfterTransfer = convertFromLkr(parsedBalance - (parsedAmount ? convertToLkr(parsedAmount) : 0));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="relative overflow-hidden glass border border-white/10 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center">
              <Send className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Transfer Funds</h1>
              <p className="text-gray-400 text-sm max-w-md font-medium">
                Send money to other users securely and instantly
              </p>
            </div>
          </div>
          
          {/* Current Balance */}
          <div className="glass px-6 py-4 rounded-xl border border-brand/30 bg-brand/5">
            <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">
              Your Balance ({userCurrency})
            </div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand" />
              {formatAmount(convertedBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Transfer Card */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/10">
        
        {/* Success Message */}
        <AnimatePresence>
          {transferSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">Transfer completed successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transfer Form */}
        <div className="space-y-6">
          <h2 className="text-xl font-black mb-6">Transfer Details</h2>

          {/* Receiver Input with Search */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
              <User className="w-3 h-3" />
              Receiver Email or Username
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery || receiverIdentifier}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setReceiverIdentifier(e.target.value);
                  setSelectedReceiver(null);
                  setTransferError('');
                }}
                placeholder="Enter email or username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 pl-12 outline-none focus:border-brand transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 glass border border-white/10 rounded-xl overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected Receiver Info */}
            {selectedReceiver && (
              <div className="mt-2 p-3 rounded-xl bg-brand/10 border border-brand/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand" />
                <div>
                  <div className="font-bold text-sm">{selectedReceiver.name}</div>
                  <div className="text-xs text-gray-400">{selectedReceiver.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Amount ({userCurrency})
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 pl-12 outline-none focus:border-brand transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {getCurrencySymbol()}
              </span>
            </div>

            {/* Balance Warning */}
            {insufficientBalance && (
              <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500">Insufficient balance</span>
              </div>
            )}

            {/* Balance After Transfer Preview */}
            {amount && !insufficientBalance && parsedAmount > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Balance after transfer:</span>
                  <span className="font-bold text-brand">
                    {formatAmount(balanceAfterTransfer)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {transferError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-500">{transferError}</span>
            </div>
          )}

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={!receiverIdentifier || !amount || insufficientBalance || transferring}
            className="w-full bg-brand disabled:opacity-50 disabled:grayscale py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {transferring ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Transfer Now
              </>
            )}
          </button>

          {/* Note about self-transfer */}
          <p className="text-[10px] text-center text-gray-500">
            Note: You cannot transfer funds to your own account
          </p>
        </div>
      </div>

      {/* Footer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Globe className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">Best & Trusted SMM Service Provider</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">#1 Sri Lanka</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Users className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">24/7 Support</span>
        </div>
      </div>
    </div>
  );
}
