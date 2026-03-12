import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles,
  Gift,
  Trophy,
  Coins,
  RotateCw,
  Clock,
  AlertCircle,
  Loader as LoaderIcon,
  Zap,
  Shield,
  Award,
  Calendar
} from 'lucide-react';
import LoadingScreen2 from '../../components/LoadingScreen2';
import authService from '../../services/auth';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';


Chart.register(ChartDataLabels);

interface UserData {
  id: number;
  name: string;
  email: string;
  balance?: number;
}

interface SpinStats {
  today_spin: any;
  total_spins: number;
  total_wins: number;
  total_win_amount: string;
  win_rate: number;
}

interface RecentSpin {
  prize_value: string;
  prize_amount: number;
  result_type: 'win' | 'loss';
  spin_time: string;
  spin_date: string;
}

const LuckySpin: React.FC = () => {
  const navigate = useNavigate();
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  
  const [user, setUser] = useState<UserData | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('LKR');
  const [authLoading, setAuthLoading] = useState(true);
  const [chartInitialized, setChartInitialized] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [timer, setTimer] = useState<string>('');
  const [spinCount, setSpinCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');
  const [canSpin, setCanSpin] = useState(true);
  const [spinStats, setSpinStats] = useState<SpinStats | null>(null);
  const [recentSpins, setRecentSpins] = useState<RecentSpin[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  const segments = [
    { 
      value: "Rs. 200", 
      color: "#1E3A5F", 
      textColor: "#ffffff", 
      min: 0, 
      max: 60 
    },
    { 
      value: "Rs. 100", 
      color: "#2C3E50", 
      textColor: "#ffffff", 
      min: 61, 
      max: 120 
    },
    { 
      value: "Rs. 20", 
      color: "#4A2C40", 
      textColor: "#ffffff", 
      min: 121, 
      max: 180 
    },
    { 
      value: "Rs. 10", 
      color: "#7D4F2D", 
      textColor: "#ffffff", 
      min: 181, 
      max: 240 
    },
    { 
      value: "Rs. 10", 
      color: "#2D2D2D",
      textColor: "#A0A0A0", 
      min: 241, 
      max: 300 
    },
    { 
      value: "No Luck", 
      color: "#1E4A4A", 
      textColor: "#ffffff", 
      min: 301, 
      max: 360 
    },
  ];



  const probabilityWeights = [0, 0, 2, 5, 5, 88];


  const visualData = [16.67, 16.67, 16.67, 16.67, 16.67, 16.67];

  const FRICTION = 0.993;
  const INITIAL_VELOCITY = 45;
  const MIN_VELOCITY = 0.1;
  const MAX_DURATION = 15000;


const selectSegmentByProbability = (): number => {
  const totalWeight = probabilityWeights.reduce((sum, w) => sum + w, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (let i = 0; i < probabilityWeights.length; i++) {
    cumulative += probabilityWeights[i];
    if (random < cumulative) {
      console.log(`Selected segment ${i} with weight ${probabilityWeights[i]}, random: ${random.toFixed(2)}`); 
      return i;
    }
  }
  console.log(`Fallback to last segment`); 
  return probabilityWeights.length - 1;
};


  const fetchSpinStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/spin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setSpinStats(response.data.stats);
        setRecentSpins(response.data.recent_spins || []);
        
        const balance = parseFloat(response.data.available_balance) || 0;
        setAvailableBalance(balance);
        
        setCurrency(response.data.currency || 'LKR');
        
        if (response.data.stats?.today_spin) {
          setCanSpin(false);
        }
      }
    } catch (error) {
      console.error('Error fetching spin stats:', error);
      setAvailableBalance(0);
      setRecentSpins([]);
    }
  };


  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        if (isMounted) {
          if (!userData) {
            navigate('/login');
            return;
          }
          setUser(userData);
          await fetchSpinStats();
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        if (isMounted) navigate('/login');
      } finally {
        if (isMounted) {
          setAuthLoading(false);
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (!wheelRef.current || !user || authLoading || loading) return;

    const initChart = setTimeout(() => {
      try {
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        const canvas = wheelRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
        }

        const isMobile = window.innerWidth < 640;
        const fontSize = isMobile ? 11 : 16;
        const mobilePadding = isMobile ? 2 : 4;
        
        chartRef.current = new Chart(wheelRef.current, {
          type: 'pie',
          data: {
            labels: segments.map(s => s.value),
            datasets: [{
              data: visualData,
              backgroundColor: segments.map(s => s.color),
              borderColor: '#ffffff',
              borderWidth: isMobile ? 1.5 : 2.5,
              hoverOffset: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 0 },
            layout: { 
              padding: mobilePadding 
            },
            plugins: {
              tooltip: { enabled: false },
              legend: { display: false },
              datalabels: {
                color: (context: any) => segments[context.dataIndex].textColor,
                font: { 
                  size: fontSize, 
                  weight: 'bold' as const, 
                  family: "'Inter', 'Montserrat', sans-serif" 
                },
                formatter: (value: any, context: any) => {
                  const index = context.dataIndex;
                  if (isMobile) {
                    if (index === 5) return 'No';
                    return segments[index].value.replace('Rs. ', '');
                  } else {
                    if (index === 5) return 'No Luck';
                    return segments[index].value;
                  }
                },
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: isMobile ? 2 : 4,
                padding: { 
                  top: isMobile ? 2 : 4, 
                  bottom: isMobile ? 2 : 4, 
                  left: isMobile ? 3 : 6, 
                  right: isMobile ? 3 : 6 
                }
              }
            }
          }
        });

        setChartInitialized(true);
      } catch (error) {
        console.error('Error initializing chart:', error);
        setChartInitialized(true);
      }
    }, 500);

    return () => {
      clearTimeout(initChart);
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [user, authLoading, loading]);

  useEffect(() => {
    if (!chartRef.current) return;

    const handleResize = () => {
      if (chartRef.current) {
        const isMobile = window.innerWidth < 640;
        
        const chart = chartRef.current;
        
        if (chart.options.plugins?.datalabels) {
       
          chart.options.plugins.datalabels.font = { 
            ...chart.options.plugins.datalabels.font,
            size: isMobile ? 11 : 16 
          };
  
          chart.options.plugins.datalabels.formatter = (value: any, context: any) => {
            const index = context.dataIndex;
            if (isMobile) {
              if (index === 5) return 'No';
              return segments[index].value.replace('Rs. ', '');
            } else {
              if (index === 5) return 'No Luck';
              return segments[index].value;
            }
          };
        }
        
        if (chart.data.datasets && chart.data.datasets[0]) {
          chart.data.datasets[0].borderWidth = isMobile ? 1.5 : 2.5;
        }
        
        chart.update();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


const handleSpin = () => {
  if (spinning || !canSpin) return;

  setSpinning(true);
  setResult(null);
  setShowResult(false);
  setError('');

  const targetSegmentIndex = selectSegmentByProbability();
  const targetSegment = segments[targetSegmentIndex];
  
 
  const targetDegree = Math.floor(
    Math.random() * (targetSegment.max - targetSegment.min) + targetSegment.min
  );

 
  const currentRotation = chartRef.current?.options.rotation || 0;
  const fullRotations = Math.floor(Math.random() * 5) + 8;
  const totalTargetRotation = (fullRotations * 360) + targetDegree;
  
  
  let rotationNeeded = totalTargetRotation - currentRotation;
  
  while (rotationNeeded < 0) {
    rotationNeeded += 360;
  }

  let currentVelocity = INITIAL_VELOCITY;
  const startTime = Date.now();
  let rotatedAmount = 0;
  
  const spinInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.ceil((MAX_DURATION - elapsed) / 1000));
    
    setTimer(`⏱️ ${remaining}s`);

    currentVelocity *= FRICTION;
    
  
    rotatedAmount += currentVelocity;

  
    if (chartRef.current) {
   
      chartRef.current.options.rotation = (currentRotation + rotatedAmount) % 360;
      chartRef.current.update();
    }

   
    if ((rotatedAmount >= rotationNeeded && currentVelocity < 5) || elapsed >= MAX_DURATION) {
      clearInterval(spinInterval);
      
      
      if (chartRef.current) {
      
        chartRef.current.options.rotation = targetDegree;
        chartRef.current.update();
      }
      
      const prizeValue = targetSegment.value;
      const prizeAmount = prizeValue.includes('Rs.') 
        ? parseFloat(prizeValue.replace('Rs. ', '')) 
        : 0;
      
      setResult(prizeValue);
      setShowResult(true);
      submitSpinResult(prizeValue, prizeAmount);
      
      setSpinning(false);
      setTimer('');
    }
  }, 20);
};

  
  const submitSpinResult = async (prizeValue: string, prizeAmount: number) => {
    try {
      const response = await axios.post(`${API_URL}/spin/spin-result`, 
        {
          result: prizeValue,
          amount: prizeAmount
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        const newBalance = parseFloat(response.data.new_balance) || 0;
        setAvailableBalance(newBalance);
        setCanSpin(false);
        setSpinCount(prev => prev + 1);
        
        await fetchSpinStats();
      }
    } catch (error: any) {
      console.error('Error submitting spin result:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      }
    }
  };


  const handlePlayAgain = () => {
    setShowResult(false);
    setResult(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <LoadingScreen2 />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">
            Lucky <span className="text-brand">Spin</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {canSpin ? 'Spin and win prizes!' : 'You have already spun today. Come back tomorrow!'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand/10 rounded-lg">
                <Coins className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm font-bold text-white">
                  {currency} {Number(availableBalance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand/10 rounded-lg">
                <Calendar className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Today's Spin</p>
                <p className="text-sm font-bold text-white">
                  {canSpin ? 'Available' : 'Used'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Win Stats */}
        {spinStats && spinStats.total_spins > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Total Spins</p>
              <p className="text-sm font-bold text-white">{spinStats.total_spins}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Wins</p>
              <p className="text-sm font-bold text-green-400">{spinStats.total_wins}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Win Rate</p>
              <p className="text-sm font-bold text-brand">{spinStats.win_rate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Wheel Section */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl p-3 sm:p-6">
            <div className="relative">
              {/* Wheel Container */}
              <div className="relative w-full aspect-square max-w-[280px] sm:max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-purple-600/5 rounded-full"></div>
                
                <canvas 
                  ref={wheelRef} 
                  className="w-full h-full relative z-10 drop-shadow-lg"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                
                {/* Center Button */}
                <button
                  onClick={handleSpin}
                  disabled={spinning || !chartInitialized || !canSpin}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand to-purple-600 text-white font-bold shadow-xl border-2 border-white/20 hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-20 flex items-center justify-center"
                >
                  {spinning ? (
                    <LoaderIcon className="w-5 h-5 sm:w-8 sm:h-8 animate-spin" />
                  ) : (
                    <RotateCw className="w-5 h-5 sm:w-8 sm:h-8" />
                  )}
                </button>

                {/* Arrow Indicator */}
                <div className="absolute -right-3 sm:-right-6 top-1/2 transform -translate-y-1/2 z-30">
                  <div className="relative">
                    <div className="w-1 sm:w-2 h-6 sm:h-12 bg-gradient-to-b from-brand to-purple-600 rounded-full shadow-lg"></div>
                    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 sm:border-l-6 border-r-3 sm:border-r-6 border-t-3 sm:border-t-6 border-l-transparent border-r-transparent border-t-brand"></div>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {!chartInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl z-30">
                  <div className="text-center">
                    <LoaderIcon className="w-6 h-6 animate-spin text-brand mx-auto mb-1" />
                    <p className="text-xs text-gray-300">Loading...</p>
                  </div>
                </div>
              )}

              {/* Timer */}
              {timer && (
                <div className="text-center mt-2 sm:mt-4">
                  <span className="inline-flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 bg-white/10 rounded-full text-brand text-xs sm:text-sm font-medium">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {timer}
                  </span>
                </div>
              )}

              {/* Result Modal */}
              {showResult && result && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-xl z-40 p-3"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-brand to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                      {result.includes('Luck') ? (
                        <AlertCircle className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                      ) : (
                        <Gift className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                      )}
                    </div>
                    
                    <h3 className="text-base sm:text-xl font-bold text-white mb-1">
                      {result.includes('Luck') ? 'Better Luck Next Time!' : 'Congratulations!'}
                    </h3>
                    
                    <p className="text-xl sm:text-3xl font-bold text-brand mb-3 sm:mb-6">
                      {result}
                    </p>
                    
                    <button
                      onClick={handlePlayAgain}
                      className="px-4 sm:px-8 py-1.5 sm:py-3 bg-brand text-white rounded-lg text-xs sm:text-base font-medium hover:bg-brand/90 transition-colors"
                    >
                      {canSpin ? 'Spin Again' : 'Close'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Can't spin message */}
              {!canSpin && !showResult && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400 bg-white/5 py-2 px-4 rounded-full inline-block">
                    ⏰ You've already spun today. Come back tomorrow!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          {/* Prizes Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl p-3 sm:p-5">
            <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
              Prizes
            </h3>
            
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between p-1.5 sm:p-3 bg-white/5 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Grand</span>
                <span className="text-sm sm:text-lg font-bold text-amber-400">Rs. 200</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-3 bg-white/5 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Medium</span>
                <span className="text-sm sm:text-lg font-bold text-pink-400">Rs. 100</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-3 bg-white/5 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Small</span>
                <span className="text-sm sm:text-lg font-bold text-blue-400">Rs. 20</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-3 bg-white/5 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Mini</span>
                <span className="text-sm sm:text-lg font-bold text-green-400">Rs. 10</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-3 bg-white/5 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Try</span>
                <span className="text-sm sm:text-lg font-bold text-gray-500">No Luck</span>
              </div>
            </div>
          </div>

          {/* Recent Winners / History */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl p-3 sm:p-5">
            <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
              Recent Spins
            </h3>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {recentSpins.length > 0 ? (
                recentSpins.map((spin, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {spin.result_type === 'win' ? (
                        <Gift className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-gray-500" />
                      )}
                      <span className="text-xs text-gray-400">{spin.spin_time}</span>
                    </div>
                    <span className={`text-xs font-bold ${spin.result_type === 'win' ? 'text-green-400' : 'text-gray-500'}`}>
                      {spin.prize_value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No spins yet</p>
              )}
            </div>
          </div>

          {/* How to Play Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl p-3 sm:p-5">
            <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
              How to Play
            </h3>
            
            <ul className="space-y-1.5 sm:space-y-3">
              {[
                'One spin per day',
                'Click center to spin',
                'Wait for wheel to stop',
                'Wins added to balance'
              ].map((text, index) => (
                <li key={index} className="flex items-start gap-1.5 sm:gap-2">
                  <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-xs text-red-500 text-center">{error}</p>
        </div>
      )}
    </motion.div>
  );
};

export default LuckySpin;
