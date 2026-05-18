import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-blue max-w-none text-gray-600">
        <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect information that you provide directly to us when you:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Create an account</li>
          <li>Make a purchase</li>
          <li>Communicate with us</li>
        </ul>
        <p className="mb-4">
          This information may include your name, email address, payment information, and any other information you choose to provide.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">We use the information we collect to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative messages, technical notices, dates, and security alerts</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Communicate with you about products, services, offers, and events</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Advertising and Analytics</h2>
        <p className="mb-4">
          We use Google AdSense Advertising on our website. Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on previous visits to our site and other sites on the Internet. Users may opt-out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy.
        </p>
        <p className="mb-4">
          We, along with third-party vendors such as Google, use first-party cookies (such as the Google Analytics cookies) and third-party cookies (such as the DoubleClick cookie) or other third-party identifiers together to compile data regarding user interactions with ad impressions and other ad service functions as they relate to our website.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Third-Party Services</h2>
        <p className="mb-4">
          We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used (e.g., payment processors). These third parties have access to your Personal Data only to perform these tasks on our behalf.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at privacy@notesadda.com.
        </p>
      </div>
    </div>
  );
}
