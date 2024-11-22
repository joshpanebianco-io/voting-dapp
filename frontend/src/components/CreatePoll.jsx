import React, { useState } from "react";

function CreatePoll() {
  const [pollName, setPollName] = useState("");
  const [options, setOptions] = useState([""]); // Start with one empty option
  const [error, setError] = useState("");

  // Handle adding a new option
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // Handle removing an option
  const removeOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!pollName.trim()) {
      setError("Poll name is required.");
      return;
    }

    if (options.some((option) => !option.trim())) {
      setError("All options must have text.");
      return;
    }

    setError("");
    console.log("Poll Created:", { pollName, options });
    alert("Poll successfully created!");
    setPollName("");
    setOptions([""]);
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg">
      <h2 className="text-white text-3xl font-bold text-center mb-6">Create a Poll</h2>
      <form onSubmit={handleSubmit}>
        {/* Poll Name Input */}
        <div className="mb-4">
          <label htmlFor="pollName" className="block text-white font-semibold mb-2">
            Poll Name:
          </label>
          <input
            type="text"
            id="pollName"
            value={pollName}
            onChange={(e) => setPollName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter poll name"
            required
          />
        </div>

        {/* Poll Options */}
        <div className="mb-6">
          <p className="text-white font-semibold mb-2">Options:</p>
          {options.map((option, index) => (
            <div key={index} className="flex items-center mb-4">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 1 && (
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
            className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Option
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Create Poll
        </button>
      </form>
    </div>
  );
}

export default CreatePoll;
