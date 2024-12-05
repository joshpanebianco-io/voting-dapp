// components/common/Spinner.jsx
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-300 border-solid rounded-full animate-spin border-t-blue-500"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
