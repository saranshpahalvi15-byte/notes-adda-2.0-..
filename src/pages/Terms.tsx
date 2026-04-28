import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-blue max-w-none text-gray-600">
        <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using NotesAdda ("the Service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree entirely with these terms, you may not access or use the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Use License</h2>
        <p className="mb-4">
          Upon purchasing or downloading free notes, we grant you a personal, non-exclusive, non-transferable license to use the materials for your personal educational purposes. You may not:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Modify or copy the materials for commercial purposes.</li>
          <li>Resell, redistribute, or share the downloaded PDFs with others.</li>
          <li>Remove any copyright or other proprietary notations from the materials.</li>
          <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
        <p className="mb-4">
          When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
        <p className="mb-4">
          The Service and its original content (including text, graphics, logos, and digital downloads) are and will remain the exclusive property of NotesAdda and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Disclaimer</h2>
        <p className="mb-4">
          The materials on NotesAdda are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at support@notesadda.com.
        </p>
      </div>
    </div>
  );
}
