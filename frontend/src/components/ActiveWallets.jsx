import { useState, useEffect } from "react";

// eslint-disable-next-line react/prop-types
const ActiveWallets = ({ isConnected }) => {
  const [activeWalletCount, setActiveWalletCount] = useState(0);

  useEffect(() => {
    // Update the active wallet count based on the `isConnected` prop
    if (isConnected) {
      setActiveWalletCount((prevCount) => prevCount + 1);
    } else {
      setActiveWalletCount((prevCount) => Math.max(prevCount - 1, 0));
    }
  }, [isConnected]); // Effect runs whenever `isConnected` changes

  return (
    <div className="fixed bottom-4 right-4 bg-purple-600 text-white p-2 rounded-lg shadow-lg z-50">
  <span className="text-sm font-semibold">
    Active Wallets: {activeWalletCount}
  </span>
</div>

  );
};

export default ActiveWallets;
