import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Landmark, Smartphone, Upload, 
  CheckCircle2, Info, ChevronDown, Loader2, XCircle,
  CreditCard, Bitcoin, Image as ImageIcon, ZoomIn
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

// Icon mapping
const iconMap: Record<string, any> = {
  'Landmark': Landmark,
  'Smartphone': Smartphone,
  'CreditCard': CreditCard,
  'Bitcoin': Bitcoin,
  'default': Landmark
};

// Currency symbols
const currencySymbols = {
  USD: '$',
  LKR: 'LKR ',
  INR: '₹'
};

interface DepositMethod {
  id: number;
  type: 'bank' | 'ez_cash' | 'other';
  name: string;
  description: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  branch: string | null;
  ez_cash_number: string | null;
  custom_details: string | null;
  icon: string | null;
  image_url: string | null;
}

export default function AddFundsView() {
  const { userData }: any = useOutletContext();
  const [depositMethods, setDepositMethods] = useState<DepositMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Currency states
  const [userCurrency, setUserCurrency] = useState<'USD' | 'LKR' | 'INR'>('LKR');
  const [conversionRates, setConversionRates] = useState({
    usdToLkr: 309.45,
    inrToLkr: 3.37
  });
  
  // States for feedback
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  // Fetch deposit methods
  useEffect(() => {
    const fetchDepositMethods = async () => {
      try {
        const response = await axios.get(`${API_URL}/deposit-details/all`);
        if (response.data.success) {
          setDepositMethods(response.data.methods);
        }
      } catch (error) {
        console.error('Error fetching deposit methods:', error);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchDepositMethods();
  }, [API_URL]);

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
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const profileResponse = await axios.get('/api/user/profiles', { withCredentials: true });
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

    fetchUserCurrency();
  }, []);

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

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currencySymbols[userCurrency] || 'LKR ';
  };

  // Convert user's currency to LKR
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

  // Convert LKR to user's currency (for display)
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

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
  };

  // Get image URL helper
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads')) return `${BASE_URL}${path}`;
    return `${BASE_URL}${path}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount || !selectedMethod) {
      setErrorMessage('Please fill all fields');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    const formData = new FormData();
    
    const amountInUserCurrency = parseFloat(amount);
    const amountInLkr = convertToLkr(amountInUserCurrency);
    formData.append('amount', amountInLkr.toFixed(2));
    formData.append('receipt', file);
    formData.append('method_id', selectedMethod.id.toString());

    try {
      const response = await axios.post('/api/deposit/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (response.data.success) {
        setStatus('success');
        setAmount('');
        setFile(null);
        setPreviewUrl(null);
        setSelectedMethod(null);
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      setErrorMessage(error.response?.data?.message || 'Something went wrong');
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  // Get icon component for method
  const getIconForMethod = (method: DepositMethod) => {
    const IconComponent = iconMap[method.icon || 'default'] || Landmark;
    return IconComponent;
  };

  const displayBalance = convertFromLkr(parseFloat(userData?.available_balance || '0'));

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      
      {/* Image Zoom Modal */}
      <AnimatePresence>
        {showImageModal && selectedMethod?.image_url && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] max-w-3xl max-h-[90vh] overflow-auto p-4"
            >
              <div className="relative">
                <img 
                  src={getImageUrl(selectedMethod.image_url)} 
                  alt={selectedMethod.name}
                  className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl"
                />
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SUCCESS/ERROR NOTIFICATION POPUP */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 px-8 py-4 rounded-3xl border shadow-2xl backdrop-blur-2xl ${
              status === 'success' 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}
          >
            {status === 'success' 
              ? <CheckCircle2 className="w-6 h-6" /> 
              : <XCircle className="w-6 h-6" />
            }
            <div className="font-black uppercase tracking-widest text-sm">
              {status === 'success' 
                ? 'Deposit Submitted Successfully!' 
                : errorMessage || 'Something went wrong. Try again.'
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden glass border border-white/10 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Add Funds</h1>
            <p className="text-gray-400 text-sm max-w-sm font-medium">Top up your account securely using manual payment methods.</p>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-right min-w-[200px] group hover:border-brand/50 transition-all">
            <div className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-1">
              Available Balance ({userCurrency})
            </div>
            <div className="text-4xl font-black text-white group-hover:scale-105 transition-transform">
              {formatAmount(displayBalance)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 ml-4">
              Step 1: Select Method
            </label>
            <div className="relative group">
              <select 
                value={selectedMethod?.id || ''}
                onChange={(e) => {
                  const method = depositMethods.find(m => m.id === parseInt(e.target.value));
                  setSelectedMethod(method || null);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand transition-all font-bold appearance-none cursor-pointer text-white placeholder-gray-500"
                disabled={loadingMethods}
              >
                <option value="" className="bg-[#0A0A0A] text-gray-400">
                  {loadingMethods ? 'Loading methods...' : 'Choose a method...'}
                </option>
                {depositMethods.map((method) => (
                  <option key={method.id} value={method.id} className="bg-[#0A0A0A]">
                    {method.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none group-hover:text-brand transition-colors" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedMethod && (
              <motion.div 
                key={selectedMethod.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass border border-brand/30 p-8 rounded-[2rem] bg-brand/5 relative overflow-hidden"
              >
                <div className="absolute -top-4 -right-4 p-8 opacity-5 text-white">
                  {React.createElement(getIconForMethod(selectedMethod), { size: 160 })}
                </div>
                
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                  <Info className="w-5 h-5 text-brand" />
                  {selectedMethod.name}
                </h3>

                {selectedMethod.description && (
                  <p className="text-sm text-gray-400 mb-4">{selectedMethod.description}</p>
                )}

                {/* Image Display */}
                {selectedMethod.image_url && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">QR Code / Image</p>
                    <div className="relative group/image">
                      <div 
                        onClick={() => setShowImageModal(true)}
                        className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-brand/20 bg-black/30 cursor-pointer hover:border-brand/50 transition-all"
                      >
                        <img 
                          src={getImageUrl(selectedMethod.image_url)} 
                          alt={`${selectedMethod.name} QR Code`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/200x200/2a2a2a/ffffff?text=QR';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Click image to zoom</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 relative z-10">
                  {/* Bank details */}
                  {selectedMethod.type === 'bank' && (
                    <>
                      {selectedMethod.bank_name && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank Name</span>
                          <span className="text-sm font-black text-white">{selectedMethod.bank_name}</span>
                        </div>
                      )}
                      {selectedMethod.account_number && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Number</span>
                          <span className="text-sm font-black text-brand text-lg">{selectedMethod.account_number}</span>
                        </div>
                      )}
                      {selectedMethod.account_holder && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Holder</span>
                          <span className="text-sm font-black text-white">{selectedMethod.account_holder}</span>
                        </div>
                      )}
                      {selectedMethod.branch && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Branch</span>
                          <span className="text-sm font-black text-white">{selectedMethod.branch}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* eZ Cash details */}
                  {selectedMethod.type === 'ez_cash' && selectedMethod.ez_cash_number && (
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">eZ Cash Number</span>
                      <span className="text-sm font-black text-brand text-lg">{selectedMethod.ez_cash_number}</span>
                    </div>
                  )}

                  {/* Other payment methods */}
                  {selectedMethod.type === 'other' && selectedMethod.custom_details && (
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Details</span>
                      <span className="text-sm font-black text-white whitespace-pre-wrap text-right">{selectedMethod.custom_details}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass border border-white/10 p-8 rounded-[2.5rem] space-y-6 sticky top-4">
            <div className="space-y-2 text-center">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand">Step 2: Verification</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Fill the details below</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 italic">
                Amount ({userCurrency})
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand transition-all font-black text-2xl text-center text-brand"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {getCurrencySymbol()}
                </span>
              </div>
              {amount && (
                <p className="text-[8px] text-gray-500 text-center mt-1">
                  ≈ LKR {convertToLkr(parseFloat(amount)).toFixed(2)} will be credited
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 italic">
                Transfer Receipt
              </label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="receipt-upload" 
                  required 
                />
                <label 
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer group-hover:border-brand/40 group-hover:bg-brand/5 transition-all overflow-hidden"
                >
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      className="w-full h-full object-cover p-3 rounded-[1.5rem]" 
                      alt="Receipt Preview" 
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 group-hover:bg-brand/10 transition-all">
                        <Upload className="w-7 h-7 text-gray-500 group-hover:text-brand" />
                      </div>
                      <span className="text-gray-500 font-black text-[10px] uppercase tracking-widest">
                        Select Receipt Image
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!selectedMethod || !amount || !file || loading}
              className="w-full bg-brand disabled:opacity-20 disabled:grayscale py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 text-white"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {loading ? 'Processing...' : 'Submit Deposit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

