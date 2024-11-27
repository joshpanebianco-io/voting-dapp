import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";

const ClosedPoll = () => {
  const [polls, setPolls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pollsPerPage] = useState(6); // Change this to adjust how many polls per page

  // Contract details
  const contractAddressPollRetriever = import.meta.env.VITE_POLLRETRIEVER_CONTRACT_ADDRESS

  // Fetch closed polls from the blockchain
  const fetchPolls = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressPollRetriever,
        PollRetrieverABI,
        provider
      );

      const pollsData = await contract.getClosedPolls();

      // Format polls data for use in the frontend
      const formattedPolls = pollsData.map((poll) => ({
        id: poll.pollId.toNumber(), // Convert BigNumber to regular number
        name: poll.pollName,
        options: poll.options,
      }));

      setPolls(formattedPolls);
    } catch (error) {
      console.error("Error fetching closed polls:", error);
    }
  };

  // Slice polls to show based on the current page
  const indexOfLastPoll = currentPage * pollsPerPage;
  const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
  const currentPolls = polls.slice(indexOfFirstPoll, indexOfLastPoll);

  // Handle next page
  const nextPage = () => {
    if (currentPage < Math.ceil(polls.length / pollsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-white text-3xl font-bold text-center mb-6">Closed Polls</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ml-7">
        {currentPolls.map((poll) => (
          <div
            key={poll.id}
            className="w-[350px] h-[350px] bg-white p-6 rounded-lg shadow-md flex flex-col"
          >
            <h3 className="text-xl font-bold text-purple-600 mb-4">{poll.name}</h3>
            <div className="mb-4 flex-grow">
              {poll.options.map((option, index) => (
                <p key={index} className="text-gray-800 mb-2">
                  - {option}
                </p>
              ))}
            </div>
            <p className="mt-auto text-red-600 font-bold text-center">
              Poll Closed
            </p>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {polls.length > pollsPerPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={prevPage}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg mr-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            onClick={nextPage}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg ml-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={currentPage === Math.ceil(polls.length / pollsPerPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ClosedPoll;
