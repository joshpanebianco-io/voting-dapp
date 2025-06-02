// import React, { useEffect } from "react";
// import PropTypes from "prop-types";
// import { useNavigate, useParams } from "react-router-dom";

// const ClosedPollDetails = ({
//   showClosedPollModal,
//   selectedPoll,
//   closedPolls,
//   closeClosedPollModal,
//   setSelectedPoll, // <-- you'll need this setter to sync state
// }) => {
//   const navigate = useNavigate();
//   const { pollId } = useParams();

//   // Update URL when modal is shown
//   useEffect(() => {
//     if (showClosedPollModal && selectedPoll) {
//       navigate(`/closed-polls/${selectedPoll}`, { replace: false });
//     }
//   }, [showClosedPollModal, selectedPoll]);

//   // Set selectedPoll from URL if opened directly
//   useEffect(() => {
//     if (pollId && !selectedPoll) {
//       setSelectedPoll(pollId);
//     }
//   }, [pollId, selectedPoll]);

//   const handleClose = () => {
//     closeClosedPollModal();
//     navigate("/closed-polls"); // Remove poll ID from URL
//   };

//   if (!showClosedPollModal || !selectedPoll) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-100 z-20">
//       <div className="bg-blue-600 p-6 rounded-lg shadow-lg">
//         {closedPolls
//           .filter((poll) => poll.id === selectedPoll)
//           .map((poll) => (
//             <div
//               key={poll.id}
//               className="w-[350px] h-[350px] bg-white p-6 rounded-lg shadow-md flex flex-col"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <h3 className="text-xl font-bold text-purple-600 break-words">
//                   {poll.name}
//                 </h3>
//                 <button
//                   className="-mt-2 -mr-2 font-semibold text-2xl text-gray-500 hover:text-gray-300"
//                   onClick={handleClose}
//                 >
//                   &times;
//                 </button>
//               </div>

//               <div className="mb-4 flex-grow overflow-auto max-h-[200px] scrollbar-hide">
//                 {poll.options.map((option, index) => (
//                   <div key={index} className="mb-3">
//                     <div className="flex items-center justify-between">
//                       <p className="text-gray-800 font-semibold truncate max-w-[70%]">
//                         {option}
//                       </p>
//                       <p className="text-gray-600 font-semibold whitespace-nowrap">
//                         {poll.voteCounts[index]} ({poll.percentages[index]}%)
//                       </p>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-lg h-2">
//                       <div
//                         className="bg-blue-600 h-full rounded-lg"
//                         style={{ width: `${poll.percentages[index]}%` }}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <p className="mt-auto text-red-600 font-bold text-center">
//                 Poll Closed
//               </p>
//             </div>
//           ))}
//       </div>
//     </div>
//   );
// };

// ClosedPollDetails.propTypes = {
//   showClosedPollModal: PropTypes.bool.isRequired,
//   selectedPoll: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   closedPolls: PropTypes.arrayOf(
//     PropTypes.shape({
//       id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
//         .isRequired,
//       name: PropTypes.string.isRequired,
//       options: PropTypes.arrayOf(PropTypes.string).isRequired,
//       voteCounts: PropTypes.arrayOf(PropTypes.number).isRequired,
//       totalVotes: PropTypes.number.isRequired,
//       percentages: PropTypes.arrayOf(PropTypes.string).isRequired,
//     })
//   ).isRequired,
//   closeClosedPollModal: PropTypes.func.isRequired,
//   setSelectedPoll: PropTypes.func.isRequired,
// };

// export default ClosedPollDetails;
