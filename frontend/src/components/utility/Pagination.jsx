// Pagination.js
// eslint-disable-next-line no-unused-vars
import React from "react";
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, prevPage, nextPage }) => {
  if (totalPages <= 1) return null; // Don't render anything if there's only one page

  return (
    <div className="flex justify-center items-center mt-6">
      <button
        onClick={prevPage}
        disabled={currentPage === 1}
        className="bg-white text-blue-600 font-bold py-2 px-4 rounded-l-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-white font-semibold ml-2 mr-2">
        {currentPage} of {totalPages}
      </span>
      <button
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className="bg-white text-blue-600 font-bold py-2 px-4 rounded-r-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,  // currentPage must be a number and is required
    totalPages: PropTypes.number.isRequired,   // totalPages must be a number and is required
    prevPage: PropTypes.func.isRequired,       // prevPage must be a function and is required
    nextPage: PropTypes.func.isRequired        // nextPage must be a function and is required
  };

export default Pagination;
