// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PollManager {

    struct Poll {
        uint256 id;
        string name;
        uint256 duration;
        uint256 startTime;
        bool isActive;
        string[] options;  // Array of options
        mapping(address => uint256) votes; // Address -> option index
    }

    uint256 public pollCount = 0;
    mapping(uint256 => Poll) public polls;  // Mapping poll ID to Poll struct

    // Event emitted when a new poll is created
    event PollCreated(uint256 pollId, string name, uint256 duration, uint256 startTime, string[] options);

    // Function to create a poll
    function createPoll(string memory _name, string[] memory _options, uint256 _duration) public {
        require(_options.length >= 2, "Poll must have at least two options.");
        require(_duration > 0, "Poll duration must be positive.");

        pollCount++;

        Poll storage newPoll = polls[pollCount];
        newPoll.id = pollCount;
        newPoll.name = _name;
        newPoll.options = _options;
        newPoll.duration = _duration;
        newPoll.startTime = block.timestamp;
        newPoll.isActive = true;

        emit PollCreated(pollCount, _name, _duration, block.timestamp, _options);
    }

    // Function to vote for a poll option
    function vote(uint256 _pollId, uint256 _optionIndex) public {
        require(polls[_pollId].isActive, "Poll is not active.");
        require(_optionIndex < polls[_pollId].options.length, "Invalid option.");
        require(polls[_pollId].votes[msg.sender] == 0, "You have already voted.");

        polls[_pollId].votes[msg.sender] = _optionIndex;
    }

    // Function to check if a poll is active
    function isPollActive(uint256 _pollId) public view returns (bool) {
        return polls[_pollId].isActive;
    }

    // Function to close a poll
    function closePoll(uint256 _pollId) public {
        require(polls[_pollId].isActive, "Poll is already closed.");
        require(block.timestamp >= polls[_pollId].startTime + polls[_pollId].duration, "Poll duration has not ended.");

        polls[_pollId].isActive = false;
    }

    // Function to get options for a specific poll
    function getPollOptions(uint256 _pollId) public view returns (string[] memory) {
        return polls[_pollId].options;
    }

    // Function to get the details of a poll by its ID (for convenience)
    function getPoll(uint256 _pollId) public view returns (
        uint256 id,
        string memory name,
        uint256 duration,
        uint256 startTime,
        bool isActive,
        string[] memory options
    ) {
        Poll storage poll = polls[_pollId];
        id = poll.id;
        name = poll.name;
        duration = poll.duration;
        startTime = poll.startTime;
        isActive = poll.isActive;
        options = poll.options;
    }
}