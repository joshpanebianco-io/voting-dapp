// components/common/Spinner.jsx
const ModalLoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-12">
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-solid rounded-full animate-spin border-t-blue-500"></div>
      </div>
    </div>
  );
};

export default ModalLoadingSpinner;
