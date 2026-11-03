/**
 * Paystack Integration Helper
 * Allows Mobile Money (MTN, Telecel, AT Money in Ghana) + Visa, Mastercard, and Bank Transfers.
 */
export function payWithPaystack({
  email,
  amount,          // amount in standard units (e.g. 50 USD or 650 GHS)
  currency = 'GHS',
  publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  onSuccess,
  onClose,
  onError,
}) {
  if (!publicKey) {
    onError?.('Paystack is not configured. Set VITE_PAYSTACK_PUBLIC_KEY to the public key from your Paystack dashboard.');
    return false;
  }
  if (typeof window.PaystackPop === 'undefined') {
    onError?.('Paystack SDK is not available. Check your internet connection and try again.');
    return false;
  }

  // Paystack expects amount in pesewas/kobo/cents (multiply by 100)
  const amountInSubunits = Math.round(amount * 100);

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: email || 'customer@brightcart.store',
    amount: amountInSubunits,
    currency: currency,
    ref: 'BC-' + Math.floor(Math.random() * 1000000000 + 1),
    metadata: {
      custom_fields: [
        {
          display_name: 'Store',
          variable_name: 'store',
          value: 'BrightCart Electronics',
        },
      ],
    },
    callback: function (response) {
      if (onSuccess) {
        onSuccess(response); // response has { reference, status, trans, message }
      }
    },
    onClose: function () {
      if (onClose) {
        onClose();
      }
    },
  });

  handler.openIframe();
  return true;
}
