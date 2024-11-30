// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/access/Ownable.sol";

contract NFTMintBurn is ERC721, Ownable {
    uint256 private _currentTokenId;
    mapping(uint256 => bool) private _nonTransferable;
    mapping(uint256 => uint256) private _tokenPollMapping;

    constructor() ERC721("VotingNFT", "PPNFT") {}

    function mintNFT(address to, uint256 pollId) external returns (uint256) {
    uint256 tokenId = _currentTokenId;
    _currentTokenId++;
    _mint(to, tokenId);
    _nonTransferable[tokenId] = true;
    _tokenPollMapping[tokenId] = pollId;
    return tokenId;  // Return the minted tokenId
}

    function getPollIdForToken(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "Token does not exist.");
        return _tokenPollMapping[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(!_nonTransferable[tokenId], "This NFT is non-transferable.");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(!_nonTransferable[tokenId], "This NFT is non-transferable.");
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        require(!_nonTransferable[tokenId], "This NFT is non-transferable.");
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function burnNFT(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist.");
        _burn(tokenId);
        delete _nonTransferable[tokenId];
        delete _tokenPollMapping[tokenId];
    }
}
