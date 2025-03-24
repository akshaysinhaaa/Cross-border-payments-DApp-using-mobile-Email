import React, { useState, useEffect } from 'react';
import { ArrowRight, Wallet, Send, RefreshCw, CreditCard, Building2, Bitcoin, Check } from 'lucide-react';
import { Button } from './components/Button';
import { formatCurrency } from './utils';
import { ethers } from 'ethers';
import type { Transaction, User, WalletBalance, PaymentMethod, CheckoutDetails } from './types';

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: 'credit-card',
    description: 'Pay securely with your card',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    type: 'bank',
    icon: 'building',
    description: 'Direct bank transfer',
  },
  {
    id: 'eth',
    name: 'Ethereum (ETH)',
    type: 'crypto',
    icon: 'bitcoin',
    description: 'Pay with MetaMask',
  },
];

function App() {
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>({
    email: '',
    mobile: '',
    amount: 0,
    emailOtp: '',
    mobileOtp: '',
    emailVerified: false,
    mobileVerified: false,
  });
  const [merchantEthAddress, setMerchantEthAddress] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [sendingOtp, setSendingOtp] = useState({ email: false, mobile: false });
  // Store generated OTPs separately from input fields
  const [generatedOtps, setGeneratedOtps] = useState({
    email: '',
    mobile: ''
  });
  // Add ethRate state
  const [ethRate, setEthRate] = useState<number>(0);
  const [ethAmount, setEthAmount] = useState<string>('0');
  const [loadingRate, setLoadingRate] = useState<boolean>(false);

  // Fetch ETH exchange rate on component mount
  useEffect(() => {
    fetchEthRate();
  }, []);

  // Calculate ETH amount when USD amount or ETH rate changes
  useEffect(() => {
    if (ethRate > 0 && checkoutDetails.amount > 0) {
      const calculatedEthAmount = (checkoutDetails.amount / ethRate).toFixed(6);
      setEthAmount(calculatedEthAmount);
    } else {
      setEthAmount('0');
    }
  }, [checkoutDetails.amount, ethRate]);

  const fetchEthRate = async () => {
    setLoadingRate(true);
    try {
      // Mock API call - in a real app, fetch from a price API like CoinGecko
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Use a sample rate - in production, replace with actual API call
      const mockRate = 2000 + Math.random() * 200;
      setEthRate(mockRate);
    } catch (err) {
      console.error('Failed to fetch ETH rate:', err);
      setError('Failed to fetch ETH exchange rate');
    } finally {
      setLoadingRate(false);
    }
  };

  const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit random number
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCheckoutDetails(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'email' ? { emailVerified: false } : {}),
      ...(name === 'mobile' ? { mobileVerified: false } : {}),
    }));
  };

  const handleMerchantAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMerchantEthAddress(e.target.value);
  };

  const handleSendOtp = async (type: 'email' | 'mobile') => {
    setSendingOtp(prev => ({ ...prev, [type]: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const otp = generateRandomOtp();
      
      // Log OTP to console and show alert instead of auto-filling
      console.log(`OTP for ${type}: ${otp}`);
      alert(`Your ${type} OTP is: ${otp}`);
      
      // Store the generated OTP separately but don't set it in the input field
      setGeneratedOtps(prev => ({
        ...prev,
        [type]: otp
      }));
      
    } catch (err) {
      setError(`Failed to send OTP to ${type}`);
    } finally {
      setSendingOtp(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleVerifyOtp = (type: 'email' | 'mobile') => {
    const inputOtp = type === 'email' ? checkoutDetails.emailOtp : checkoutDetails.mobileOtp;
    const generatedOtp = generatedOtps[type];
    
    if (inputOtp === generatedOtp) {
      setCheckoutDetails(prev => ({
        ...prev,
        [type === 'email' ? 'emailVerified' : 'mobileVerified']: true,
      }));
    } else {
      setError(`Invalid ${type} OTP. Please try again.`);
    }
  };

  const handlePaymentSelect = (methodId: string) => {
    setSelectedPayment(methodId);
    setError('');
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to make ETH payments');
      return false;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return true;
    } catch (err) {
      setError('Failed to connect to MetaMask');
      return false;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setProcessing(true);

    try {
      if (selectedPayment === 'eth') {
        if (!merchantEthAddress) {
          setError('Merchant Ethereum address is required for ETH payments');
          setProcessing(false);
          return;
        }

        const connected = await connectMetaMask();
        if (!connected) {
          setProcessing(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Use calculated ETH amount from exchange rate
        const ethAmountToSend = ethers.parseEther(ethAmount);

        const tx = await signer.sendTransaction({
          to: merchantEthAddress,
          value: ethAmountToSend,
        });

        await tx.wait();
        setStep(3);
      } else {
        setStep(3);
      }
    } catch (err) {
      setError('Transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const isFormValid = () => {
    return (
      checkoutDetails.email &&
      checkoutDetails.mobile &&
      checkoutDetails.amount > 0 &&
      checkoutDetails.emailVerified &&
      checkoutDetails.mobileVerified
    );
  };

  const getPaymentIcon = (iconName: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="w-6 h-6" />;
      case 'building':
        return <Building2 className="w-6 h-6" />;
      case 'bitcoin':
        return <Bitcoin className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-8">
            Checkout
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-2 rounded-full bg-gray-700">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">Step {step} of 3</span>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Merchant Ethereum Address
                  </label>
                  <input
                    type="text"
                    value={merchantEthAddress}
                    onChange={handleMerchantAddressChange}
                    className="w-full p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter merchant Ethereum address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        name="email"
                        value={checkoutDetails.email}
                        onChange={handleInputChange}
                        className="flex-1 p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                      <Button
                        onClick={() => handleSendOtp('email')}
                        disabled={!checkoutDetails.email || sendingOtp.email || checkoutDetails.emailVerified}
                        variant={checkoutDetails.emailVerified ? "secondary" : "default"}
                        className="whitespace-nowrap"
                      >
                        {checkoutDetails.emailVerified ? (
                          <><Check className="w-4 h-4 mr-2" /> Verified</>
                        ) : (
                          sendingOtp.email ? 'Sending...' : 'Send OTP'
                        )}
                      </Button>
                    </div>
                    {!checkoutDetails.emailVerified && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="emailOtp"
                          value={checkoutDetails.emailOtp}
                          onChange={handleInputChange}
                          className="flex-1 p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email OTP"
                        />
                        <Button
                          onClick={() => handleVerifyOtp('email')}
                          disabled={!checkoutDetails.emailOtp || !generatedOtps.email}
                          className="whitespace-nowrap"
                        >
                          Verify OTP
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        name="mobile"
                        value={checkoutDetails.mobile}
                        onChange={handleInputChange}
                        className="flex-1 p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your mobile number"
                      />
                      <Button
                        onClick={() => handleSendOtp('mobile')}
                        disabled={!checkoutDetails.mobile || sendingOtp.mobile || checkoutDetails.mobileVerified}
                        variant={checkoutDetails.mobileVerified ? "secondary" : "default"}
                        className="whitespace-nowrap"
                      >
                        {checkoutDetails.mobileVerified ? (
                          <><Check className="w-4 h-4 mr-2" /> Verified</>
                        ) : (
                          sendingOtp.mobile ? 'Sending...' : 'Send OTP'
                        )}
                      </Button>
                    </div>
                    {!checkoutDetails.mobileVerified && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="mobileOtp"
                          value={checkoutDetails.mobileOtp}
                          onChange={handleInputChange}
                          className="flex-1 p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter mobile OTP"
                        />
                        <Button
                          onClick={() => handleVerifyOtp('mobile')}
                          disabled={!checkoutDetails.mobileOtp || !generatedOtps.mobile}
                          className="whitespace-nowrap"
                        >
                          Verify OTP
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={checkoutDetails.amount || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                {/* ETH Exchange Rate Card */}
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/70">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-300 flex items-center gap-2">
                      <Bitcoin className="w-5 h-5 text-blue-400" />
                      ETH Exchange Rate
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchEthRate} 
                      disabled={loadingRate}
                      className="h-8 px-2"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loadingRate ? 'animate-spin' : ''}`} />
                      {loadingRate ? 'Updating...' : 'Refresh'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Current Rate</div>
                      <div className="font-semibold">
                        {loadingRate ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : ethRate > 0 ? (
                          <span>1 ETH = ${ethRate.toFixed(2)} USD</span>
                        ) : (
                          <span className="text-gray-500">Unavailable</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Equivalent in ETH</div>
                      <div className="font-semibold">
                        {checkoutDetails.amount > 0 && ethRate > 0 ? (
                          <span>{ethAmount} ETH</span>
                        ) : (
                          <span className="text-gray-500">Enter USD amount</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-900/50 text-red-300 border border-red-800 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => setStep(2)}
                  disabled={!isFormValid()}
                  className="w-full"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Select Payment Method</h2>
              
              {error && (
                <div className="p-4 bg-red-900/50 text-red-300 border border-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => handlePaymentSelect(method.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-blue-400">
                        {getPaymentIcon(method.icon)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-200">{method.name}</h3>
                        <p className="text-sm text-gray-400">{method.description}</p>
                        {method.id === 'eth' && ethRate > 0 && (
                          <p className="text-xs text-blue-400 mt-1">
                            {checkoutDetails.amount > 0 
                              ? `${checkoutDetails.amount} USD ≈ ${ethAmount} ETH`
                              : `1 ETH = $${ethRate.toFixed(2)} USD`
                            }
                          </p>
                        )}
                      </div>
                      <div className="ml-auto">
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            selectedPayment === method.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedPayment || processing}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-100">
                Payment {selectedPayment === 'eth' ? 'Completed!' : 'Initiated!'}
              </h2>
              
              <p className="text-gray-400">
                {selectedPayment === 'eth'
                  ? `Your ETH payment of ${ethAmount} ETH has been processed successfully`
                  : 'Your payment is being processed'}
              </p>
              
              <Button
                onClick={() => {
                  setStep(1);
                  setCheckoutDetails({
                    email: '',
                    mobile: '',
                    amount: 0,
                    emailOtp: '',
                    mobileOtp: '',
                    emailVerified: false,
                    mobileVerified: false,
                  });
                  setMerchantEthAddress('');
                  setSelectedPayment('');
                  setError('');
                  setGeneratedOtps({ email: '', mobile: '' });
                  setEthAmount('0');
                }}
              >
                Make Another Payment
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;