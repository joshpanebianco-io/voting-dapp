// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PollManager {

    struct Poll {
        uint256 id;
        string name;
        uint256 duration; // Duration in minutes (for reference)
        uint256 startTime; 
        uint256 endTime;   // New property to store poll end time
        bool isActive;
        string[] options;
        mapping(address => uint256) votes; // Address -> option index
    }

    uint256 public pollCount = 0;
    mapping(uint256 => Poll) public polls;  // Mapping poll ID to Poll struct

    event PollCreated(uint256 pollId, string name, uint256 duration, uint256 startTime, uint256 endTime, string[] options);

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
        newPoll.endTime = block.timestamp + (_duration * 60); // Convert minutes to seconds
        newPoll.isActive = true;

        emit PollCreated(pollCount, _name, _duration, newPoll.startTime, newPoll.endTime, _options);
    }

    function vote(uint256 _pollId, uint256 _optionIndex) public {
        require(block.timestamp < polls[_pollId].endTime, "Poll has ended."); // Ensure voting is within duration
        require(polls[_pollId].isActive, "Poll is not active.");
        require(_optionIndex < polls[_pollId].options.length, "Invalid option.");
        require(polls[_pollId].votes[msg.sender] == 0, "You have already voted.");

        polls[_pollId].votes[msg.sender] = _optionIndex;
    }

    function isPollActive(uint256 _pollId) public view returns (bool) {
        return block.timestamp < polls[_pollId].endTime && polls[_pollId].isActive;
    }

    function closePoll(uint256 _pollId) public {
        require(block.timestamp >= polls[_pollId].endTime, "Poll duration has not ended.");
        require(polls[_pollId].isActive, "Poll is already closed.");

        polls[_pollId].isActive = false;
    }

    function getPollOptions(uint256 _pollId) public view returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getPoll(uint256 _pollId) public view returns (
        uint256 id,
        string memory name,
        uint256 duration,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        string[] memory options
    ) {
        Poll storage poll = polls[_pollId];
        return (poll.id, poll.name, poll.duration, poll.startTime, poll.endTime, poll.isActive, poll.options);
    }
}
