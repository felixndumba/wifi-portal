import Header from "../../components/header";

export default function PlansPage() {
  const plans = [
    { name: "Daily", price: 50, data: "1GB", validity: "24 Hours" },
    { name: "Weekly", price: 300, data: "5GB", validity: "7 Days" },
    { name: "Monthly Basic", price: 1000, data: "15GB", validity: "30 Days" },
    { name: "Monthly Standard", price: 2000, data: "40GB", validity: "30 Days" },
    { name: "Monthly Premium", price: 3500, data: "100GB", validity: "30 Days" },
    { name: "Unlimited", price: 5000, data: "Unlimited", validity: "30 Days" },
  ];

  return (
    <div>
      <Header />
      <div className="text-center mt-10">
        <h1 className="text-4xl font-bold">
          INTERNET <span className="text-yellow-500">PLANS</span>
        </h1>
        <p className="text-gray-600 mt-2">Choose the plan that suits your needs</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-10 w-[900px] mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
            <p className="text-3xl font-bold text-yellow-500 mt-4">KSh {plan.price}</p>
            <p className="text-gray-600 mt-2">{plan.data}</p>
            <p className="text-sm text-gray-500 mt-1">Valid for {plan.validity}</p>
            <button className="mt-6 bg-black text-white px-8 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

