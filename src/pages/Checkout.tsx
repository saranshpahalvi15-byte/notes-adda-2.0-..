import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [items, setItems] = useState<any[]>(location.state?.items || []);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'referral' | 'coupon', value: number, code: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (items.length === 0) {
      navigate('/notes');
    }
  }, [user, items, navigate]);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.value) / 100 : 0;
  const total = subtotal - discountAmount;

  const applyDiscount = async () => {
    setError('');
    if (!discountCode) return;

    try {
      // Check if it's a coupon
      const q = query(collection(db, 'coupons'), where('code', '==', discountCode), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const coupon = snapshot.docs[0].data();
        setAppliedDiscount({ type: 'coupon', value: coupon.discountPercent, code: discountCode });
        return;
      }

      // Check if it's a referral code
      const userQ = query(collection(db, 'users'), where('referralCode', '==', discountCode));
      const userSnapshot = await getDocs(userQ);
      
      if (!userSnapshot.empty) {
        if (userSnapshot.docs[0].id === user?.uid) {
          setError("You cannot use your own referral code.");
          return;
        }
        setAppliedDiscount({ type: 'referral', value: 20, code: discountCode });
        return;
      }

      setError("Invalid or expired discount code.");
    } catch (err: any) {
      setError("Error applying discount code.");
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderData = {
        userId: user.uid,
        items: items.map(item => ({ itemId: item.id, type: item.type, price: item.price })),
        subtotal,
        discountApplied: discountAmount,
        totalAmount: total,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Send email receipt
      try {
        const env = (import.meta as any).env;
        const apiUrl = env.VITE_API_URL 
          ? `${env.VITE_API_URL}/api/send-receipt` 
          : '/api/send-receipt';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: profile?.name,
            items: items,
            total: total
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.previewUrl) {
          setEmailPreviewUrl(data.previewUrl);
        }
      } catch (emailErr: any) {
        console.error("Failed to send email receipt:", emailErr);
        // We still set success to true because the order was saved, but we can alert the user
        alert(`Payment was successful, but there was an issue sending the email receipt. Error: ${emailErr.message || 'Network Error'}. Please check your dashboard for your notes.`);
      }

      setSuccess(true);
      
      // Redirect to dashboard after 5 seconds (giving them time to see the email link if testing)
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    } catch (err: any) {
      setError("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-4">Your notes are now available in your dashboard.</p>
        
        {emailPreviewUrl ? (
          <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-800 mb-2 font-medium">An email receipt with download links has been sent!</p>
            <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline break-all">
              View Email Preview (Dev Mode)
            </a>
          </div>
        ) : (
          <p className="text-gray-600 mb-8">An email receipt with download links has been sent to your registered email.</p>
        )}

        <p className="text-sm text-gray-500 animate-pulse">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{item.type} • Class {item.classLevel} • {item.subject}</p>
                </div>
                <span className="font-bold text-gray-900">₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center p-4 border border-indigo-600 rounded-xl bg-indigo-50 cursor-pointer">
              <input type="radio" name="payment" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" defaultChecked />
              <span className="ml-3 font-medium text-gray-900">UPI (GPay, PhonePe, Paytm)</span>
            </label>
            <label className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="payment" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
              <span className="ml-3 font-medium text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
                Credit / Debit Card
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Discount Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Referral or Coupon"
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={!!appliedDiscount}
            />
            <button
              onClick={applyDiscount}
              disabled={!!appliedDiscount || !discountCode}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{error}</p>}
          {appliedDiscount && (
            <div className="mt-3 flex items-center justify-between bg-green-50 text-green-700 p-3 rounded-md text-sm">
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Code applied!</span>
              <button onClick={() => setAppliedDiscount(null)} className="text-green-800 hover:underline font-medium">Remove</button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Total</h2>
          <div className="space-y-3 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({appliedDiscount.value}%)</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex justify-between text-lg font-bold text-gray-900">
              <span>Final Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
          >
            {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
