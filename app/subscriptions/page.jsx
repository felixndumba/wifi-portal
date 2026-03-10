"use client"

import { useState, useEffect } from "react";
import Header from "../../components/header";

export default function SubscriptionsPage() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for logged-in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchSubscriptions(userData.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptions = async (userId) => {
    try {
      const res = await fetch(`/api/subscriptions?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Static plans for new subscriptions
  const routerPlans = [
    { 
      name: "Basic Router", 
      price: 1500, 
      deposit: 500,
      speed: "up to 10Mbps",
      type: "Router Rental",
      features: ["Standard WiFi Router", "Perfect for light use", "24/7 Support"]
    },
    { 
      name: "Standard Router", 
      price: 2500, 
      deposit: 800,
      speed: "up to 25Mbps",
      type: "Router Rental",
      features: ["Dual Band Router", "Better coverage", "Priority Support"]
    },
    { 
      name: "Premium Router", 
      price: 4000, 
      deposit: 1200,
      speed: "up to 50Mbps",
      type: "Router Rental",
      features: ["High Performance", "Extended Range", "Premium Support"]
    },
  ];

  const installationPlans = [
    { 
      name: "Standard Installation", 
      price: 500, 
      type: "One-time",
      features: ["Professional Setup", "Wall Mounting Included", "Basic Cable Management"]
    },
    { 
      name: "Premium Installation", 
      price: 1500, 
      type: "One-time",
      features: ["Full Network Setup", "Multiple Device Configuration", "Advanced Cable Management", "Signal Optimization"]
    },
  ];

  const devicePlans = [
    { 
      name: "WiFi Range Extender", 
      price: 2500, 
      type: "Device Purchase",
      features: ["Extends WiFi Coverage", "Easy Setup", "Dual Band"]
    },
    { 
      name: "Mesh WiFi System", 
      price: 8000, 
      type: "Device Purchase",
      features: ["Whole Home Coverage", "Seamless Roaming", "APP Control"]
    },
    { 
      name: "Outdoor Access Point", 
      price: 6000, 
      type: "Device Purchase",
      features: ["Weather Resistant", "Long Range", "POE Powered"]
    },
  ];

  const SubscriptionCard = ({ plan, isPopular = false, onSubscribe }) => (
    <div className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden ${isPopular ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white' : 'border-gray-200 bg-white'}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
      )}
      <div className="text-center">
        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {plan.type}
        </span>
        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
        <div className="mt-4">
          <span className="text-3xl font-bold text-yellow-500">KSh {plan.price}</span>
          {plan.deposit && <span className="text-gray-500 text-sm"> + KSh {plan.deposit} deposit</span>}
        </div>
        {plan.speed && (
          <p className="text-sm text-gray-500 mt-2">Speed: {plan.speed}</p>
        )}
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <span className="text-green-500">✓</span> {feature}
            </li>
          ))}
        </ul>
        {onSubscribe && (
          <button 
            onClick={() => onSubscribe(plan)}
            className="mt-6 w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Subscribe
          </button>
        )}
      </div>
    </div>
  );

  const ActiveSubscriptionCard = ({ subscription }) => (
    <div className="border-2 border-green-400 rounded-xl p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
          ACTIVE
        </span>
        <span className="text-gray-500 text-sm">{subscription.plan_type}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-800">{subscription.plan_name}</h3>
      <div className="mt-4">
        <span className="text-3xl font-bold text-green-600">KSh {subscription.price}</span>
        {subscription.deposit > 0 && <span className="text-gray-500 text-sm"> + KSh {subscription.deposit} deposit</span>}
      </div>
      {subscription.speed && (
        <p className="text-sm text-gray-500 mt-2">Speed: {subscription.speed}</p>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>Started: {formatDate(subscription.start_date)}</p>
        {subscription.end_date && <p>Ends: {formatDate(subscription.end_date)}</p>}
        {subscription.mikrotik_user && <p>Mikrotik User: {subscription.mikrotik_user}</p>}
      </div>
    </div>
  );

  const handleSubscribe = async (plan) => {
    if (!user) {
      alert("Please login to subscribe to a plan");
      return;
    }

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          planName: plan.name,
          planType: plan.type,
          price: plan.price,
          deposit: plan.deposit,
          speed: plan.speed
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Subscription created successfully!");
        fetchSubscriptions(user.id);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Failed to create subscription");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center mt-20">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="text-center mt-8 mb-8">
        <h1 className="text-4xl font-bold">
          MY <span className="text-yellow-500">SUBSCRIPTIONS</span>
        </h1>
        {user ? (
          <p className="text-gray-600 mt-2">Welcome, {user.name}!</p>
        ) : (
          <p className="text-gray-600 mt-2">Please login to view your subscriptions</p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* User's Active Subscriptions */}
        {user && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Your Active Subscriptions</h2>
            <p className="text-gray-500 mb-6">Currently active plans on your account</p>
            
            {subscriptions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map((sub) => (
                  <ActiveSubscriptionCard key={sub.id} subscription={sub} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-600">You don't have any active subscriptions yet.</p>
                <p className="text-gray-500 mt-2">Browse our plans below to get started!</p>
              </div>
            )}
          </section>
        )}

        {/* Router Rental Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📡 Router Rental</h2>
          <p className="text-gray-500 mb-6">Rent a router with your internet plan</p>
          <div className="grid md:grid-cols-3 gap-6">
            {routerPlans.map((plan, index) => (
              <SubscriptionCard 
                key={index} 
                plan={plan} 
                isPopular={index === 1} 
                onSubscribe={user ? handleSubscribe : null}
              />
            ))}
          </div>
        </section>

        {/* Installation Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🔧 Installation</h2>
          <p className="text-gray-500 mb-6">Professional installation services</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {installationPlans.map((plan, index) => (
              <SubscriptionCard 
                key={index} 
                plan={plan} 
                onSubscribe={user ? handleSubscribe : null}
              />
            ))}
          </div>
        </section>

        {/* Device Purchase Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📱 Device Purchase</h2>
          <p className="text-gray-500 mb-6">Buy WiFi devices and accessories</p>
          <div className="grid md:grid-cols-3 gap-6">
            {devicePlans.map((plan, index) => (
              <SubscriptionCard 
                key={index} 
                plan={plan} 
                onSubscribe={user ? handleSubscribe : null}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

