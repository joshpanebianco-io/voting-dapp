import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollManagerABI from "../abis/PollManager.json";

const CreatePoll = () => {
  const [pollName, setPollName] = useState("");
  const [options, setOptions] = useState(["", ""]); // Default to two empty options
  const [duration, setDuration] = useState(""); // New state for poll duration
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal visibility state

  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

  useEffect(() => {
    const initContract = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddressPollManager,
          PollManagerABI,
          signer
        );
        setContract(contractInstance);
      } catch (error) {
        console.error("Error initializing contract:", error);
        setError("Failed to initialize contract.");
      }
    };
    initContract();
  }, []);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pollName.trim()) {
      setError("Poll name is required.");
      return;
    }

    if (options.some((option) => !option.trim())) {
      setError("All options must have text.");
      return;
    }

    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Poll duration must be a positive number (in minutes).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const tx = await contract.createPoll(pollName, options, Number(duration));
      await tx.wait();
      setShowSuccessModal(true); // Show success modal when poll is created
      setPollName("");
      setOptions(["", ""]);
      setDuration("");
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  // Close the success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg">
      <h2 className="text-white text-3xl font-bold text-center mb-6">Create Poll</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="pollName" className="block text-white font-semibold mb-2">
            Poll Name:
          </label>
          <input
            type="text"
            id="pollName"
            value={pollName}
            onChange={(e) => setPollName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Enter poll name"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="duration" className="block text-white font-semibold mb-2">
            Poll Duration (minutes):
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Enter duration in minutes"
            required
          />
        </div>

        <div className="mb-6">
          <p className="text-white font-semibold mb-2">Options:</p>
          {options.map((option, index) => (
            <div key={index} className="flex items-center mb-4">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 px-3 py-1 text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="w-full mt-2 bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Add Option
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-gray-800 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={loading}
        >
          {loading ? "Creating Poll..." : "Create Poll"}
        </button>
      </form>

      {/* Loading Modal */}
      {loading && (
        <div className="modal">
          <div className="blockchain">
            <div className="block block-1"></div>
            <div className="chain"></div>
            <div className="block block-2"></div>
            <div className="chain"></div>
            <div className="block block-3"></div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold text-green-600 text-center">Success!</h3>
            <p className="text-gray-800 font-medium text-center mt-4">
              Your poll has been successfully created.
            </p>
            <div className="mt-6 text-center">
              <button
                onClick={closeSuccessModal}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePoll;
