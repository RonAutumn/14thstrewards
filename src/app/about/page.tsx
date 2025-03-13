import React from "react";

export const metadata = {
  title: "About | Heaven High NYC",
  description: "Learn more about Heaven High NYC",
};

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">About Us</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-xl mb-6">
          Welcome to HeavenHighNyc, where we focus on providing high-quality products and exclusive 
          offerings to our loyal customers. Our goal is to create an unparalleled experience that 
          prioritizes quality, discretion, and efficiency.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">How Payments Work</h2>
        <p>
          To ensure seamless and secure transactions, all payments are processed through StickiTrips, 
          our official merch site. When you proceed to checkout, you will be redirected to StickiTrips' 
          secure payment portal to complete your purchase.
        </p>
        <p className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-md my-4 flex items-start">
          <span className="mr-2">🔔</span>
          <span className="font-medium">Important: Your billing statement will reflect a charge from StickiTrips. 
          This is normal and part of our standard checkout process.</span>
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">No Refunds or Exchanges</h2>
        <p>
          All sales are final. We do not offer refunds, returns, or exchanges under any circumstances. 
          Please ensure your order is correct before completing your purchase.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          If you have any questions about your order or the payment process, feel free to contact us at:
        </p>
        <ul className="list-none pl-0 space-y-2">
          <li className="flex items-center">
            <span className="mr-2">📧</span> Email: <a href="mailto:issues@heavenhighnyc.com" className="ml-2">issues@heavenhighnyc.com</a>
          </li>
          <li className="flex items-center">
            <span className="mr-2">📞</span> Phone: <span className="ml-2">(718) 306-9021 (Text Only)</span>
          </li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Issues with Your Order?</h2>
        <p>
          If you experience any issues with your order, please reach out to us as soon as possible. 
          While we do not offer refunds or exchanges, we are happy to assist with any concerns regarding 
          order fulfillment, shipping, or other inquiries.
        </p>
      </div>
    </div>
  );
} 