// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Hololocker is Ownable, IERC721Receiver {
    struct LockInfo {
        // Specified by blocks, 0 if withdrawal hasn't been requested
        uint256 unlockTime;
        // Rightful owner of the NFT
        address owner;
        // Account that initiated the lock
        address operator;
    }

    // Denominated in blocks
    uint256 public constant MINIMUM_LOCK_TIME = 64;
    // Denominated in blocks
    uint256 public lockTime;

    // token address => token ID => LockInfo
    mapping(address => mapping(uint256 => LockInfo)) public nftLockInfo;

    error InvalidLockTime();
    error NotUnlockedYet();
    error TokenNotLocked();
    error Unauthorized();
    error UnlockAlreadyRequested();

    // Permits modifications only by the owner of the specified identity.
    modifier authorized(address token, uint256 tokenId) {
        _authorized(token, tokenId);
        _;
    }

    function lock(address token, uint256 tokenId) external {
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);
        nftLockInfo[token][tokenId].owner = msg.sender;
        nftLockInfo[token][tokenId].operator = msg.sender;
    }

    /// @dev Since only authorized user can use this function, it cannot be used without locking NFT beforehand
    function requestUnlock(address token, uint256 tokenId) external authorized(token, tokenId) {
        if (nftLockInfo[token][tokenId].unlockTime != 0) {
            revert UnlockAlreadyRequested();
        }
        nftLockInfo[token][tokenId].unlockTime = block.number + lockTime;
    }

    function withdraw(address token, uint256 tokenId) external authorized(token, tokenId) {
        if (nftLockInfo[token][tokenId].unlockTime == 0 || block.number < nftLockInfo[token][tokenId].unlockTime) {
            revert NotUnlockedYet();
        }
        IERC721(token).transferFrom(address(this), nftLockInfo[token][tokenId].owner, tokenId);
        delete nftLockInfo[token][tokenId];
    }

    /// @dev Handles initiating a lock upon direct NFT safeTransferFrom function call
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        address token = msg.sender;
        nftLockInfo[token][tokenId].owner = from;
        nftLockInfo[token][tokenId].operator = operator;
        return IERC721Receiver.onERC721Received.selector;
    }

    function setLockTime(uint256 newLockTime) external onlyOwner {
        if (newLockTime < MINIMUM_LOCK_TIME) {
            revert InvalidLockTime();
        }
        lockTime = newLockTime;
    }

    function _authorized(address token, uint256 tokenId) internal view {
        if (msg.sender != nftLockInfo[token][tokenId].owner && msg.sender != nftLockInfo[token][tokenId].operator) {
            revert Unauthorized();
        }
    }
}
