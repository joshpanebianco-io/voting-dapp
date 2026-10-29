// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title BallotNFT
 * @notice A soulbound, single-use voting credential.
 *
 *         One ballot is issued to a voter when they register for a poll and is
 *         burned when they cast their vote. Ballots cannot be transferred or
 *         approved, and only the PollManager that deployed this contract may
 *         mint or burn them.
 */
contract BallotNFT is ERC721 {
    /// @notice The only address allowed to mint and burn ballots.
    address public immutable pollManager;

    /// @dev Token id 0 is reserved to mean "no ballot".
    uint256 private _nextTokenId = 1;

    /// @dev tokenId => pollId the ballot was issued for.
    mapping(uint256 => uint256) private _pollOf;

    event BallotIssued(uint256 indexed tokenId, uint256 indexed pollId, address indexed voter);
    event BallotSpent(uint256 indexed tokenId, uint256 indexed pollId, address indexed voter);

    error OnlyPollManager();
    error NonTransferable();

    modifier onlyPollManager() {
        if (msg.sender != pollManager) revert OnlyPollManager();
        _;
    }

    constructor(address pollManager_) ERC721("DecentraVote Ballot", "BALLOT") {
        pollManager = pollManager_;
    }

    /// @notice Issue a ballot for `pollId` to `to`. Callable only by the PollManager.
    function mint(address to, uint256 pollId) external onlyPollManager returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _pollOf[tokenId] = pollId;
        _mint(to, tokenId);
        emit BallotIssued(tokenId, pollId, to);
    }

    /// @notice Spend (burn) a ballot once the vote has been recorded. Callable only by the PollManager.
    function burn(uint256 tokenId) external onlyPollManager {
        address voter = _requireOwned(tokenId);
        uint256 pollId = _pollOf[tokenId];
        _burn(tokenId);
        delete _pollOf[tokenId];
        emit BallotSpent(tokenId, pollId, voter);
    }

    /// @notice The poll a ballot was issued for. Reverts if the ballot does not exist.
    function pollOf(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return _pollOf[tokenId];
    }

    /// @notice Whether `tokenId` is an existing, unspent ballot.
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /// @notice Total ballots ever issued.
    function totalIssued() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ---------------------------------------------------------------------
    // Soulbound: allow mint (from == 0) and burn (to == 0), block transfers.
    // ---------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert NonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert NonTransferable();
    }
}
