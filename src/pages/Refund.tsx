import React from 'react';

export default function Refund() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
      
      <div className="prose prose-blue max-w-none text-gray-600">
        <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Digital Products</h2>
        <p className="mb-4">
          All our products are digital downloads (PDFs). Due to the nature of digital goods, they cannot be returned physically. Once a digital product has been downloaded, it cannot be "returned".
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Non-Refundable Items</h2>
        <p className="mb-4">
          Generally, all sales are final, and we do not offer refunds, exchanges, or cancellations for digital products once the download link has been provided or the file has been accessed.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Exceptions</h2>
        <p className="mb-4">
          We may grant a refund at our sole discretion in the following exceptional circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Duplicate Purchase:</strong> If you accidentally purchase the same item twice within 24 hours.</li>
          <li><strong>Defective File:</strong> If the file is corrupted or cannot be opened, and our technical support cannot resolve the issue within 48 hours of you reporting it.</li>
          <li><strong>Incorrect Product:</strong> If you receive a completely different file than what was described on the product page.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Requesting a Refund</h2>
        <p className="mb-4">
          To request a refund under the exceptional circumstances listed above, please contact our support team within 7 days of your purchase. You must include:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Your order number</li>
          <li>The email address used for the purchase</li>
          <li>A detailed explanation of the issue</li>
          <li>Any relevant screenshots</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Processing</h2>
        <p className="mb-4">
          If your refund is approved, it will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days, depending on your card issuer's policies.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
        <p>
          If you have any questions about our Returns and Refunds Policy, please contact us at support@notesadda.com.
        </p>
      </div>
    </div>
  );
}
