// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Hololocker is Ownable, IERC721Receiver {
    struct LockInfo {
        // Timestamp when NFT will be withdrawable, 0 if withdrawal hasn't been requested
        uint256 unlockTime;
        // Rightful owner of the NFT
        address owner;
        // Account that initiated the lock
        address operator;
    }

    uint256 public constant MAXIMUM_LOCK_TIME = 1 days;
    uint256 public lockTime;

    // token address => token ID => LockInfo
    mapping(address => mapping(uint256 => LockInfo)) public nftLockInfo;

    event Lock(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event Unlock(address indexed token, address indexed owner, uint256 tokenId, address operator, uint256 unlockTime);
    event Withdraw(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event LockTimeUpdate(uint256 newValue);

    error InvalidLockTime();
    error NotUnlockedYet();
    error TokenNotLocked();
    error Unauthorized();
    error UnlockAlreadyRequested();
    error InvalidInputArity();

    constructor(uint256 lockTime_) {
        lockTime = lockTime_;
    }

    /// @dev Can lock multiple NFTs in one batch
    function lock(address[] memory tokens, uint256[] memory tokenIds, address owner) external {
        if (tokens.length != tokenIds.length) {
            revert InvalidInputArity();
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 tokenId = tokenIds[i];
            nftLockInfo[token][tokenId].owner = owner;
            nftLockInfo[token][tokenId].operator = msg.sender;
            emit Lock(token, owner, tokenId, msg.sender);
            IERC721(token).transferFrom(owner, address(this), tokenId);
        }
    }

    /// @dev Since only authorized user can use this function, it cannot be used without locking NFT beforehand,
    /// because both info.owner and info.operator would be address(0)
    function requestUnlock(address[] memory tokens, uint256[] memory tokenIds) external {
        if (tokens.length != tokenIds.length) {
            revert InvalidInputArity();
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 tokenId = tokenIds[i];
            LockInfo storage info = nftLockInfo[token][tokenId];
            if (msg.sender != info.owner && msg.sender != info.operator) {
                revert Unauthorized();
            }
            if (info.unlockTime != 0) {
                revert UnlockAlreadyRequested();
            }
            uint256 unlockTime = block.timestamp + lockTime;
            info.unlockTime = unlockTime;
            emit Unlock(token, info.owner, tokenId, info.operator, unlockTime);
        }
    }

    function withdraw(address[] memory tokens, uint256[] memory tokenIds) external {
        if (tokens.length != tokenIds.length) {
            revert InvalidInputArity();
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 tokenId = tokenIds[i];
            LockInfo storage info = nftLockInfo[token][tokenId];
            if (msg.sender != info.owner && msg.sender != info.operator) {
                revert Unauthorized();
            }
            if (info.unlockTime == 0 || block.timestamp < info.unlockTime) {
                revert NotUnlockedYet();
            }
            address owner = info.owner;
            emit Withdraw(token, info.owner, tokenId, info.operator);
            delete nftLockInfo[token][tokenId];
            IERC721(token).transferFrom(address(this), owner, tokenId);
        }
    }

    /// @dev Handles initiating a lock upon direct NFT safeTransferFrom function call
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        address token = msg.sender;
        nftLockInfo[token][tokenId].owner = from;
        nftLockInfo[token][tokenId].operator = operator;
        emit Lock(token, from, tokenId, operator);
        return IERC721Receiver.onERC721Received.selector;
    }

    function setLockTime(uint256 newLockTime) external onlyOwner {
        if (newLockTime > MAXIMUM_LOCK_TIME) {
            revert InvalidLockTime();
        }
        lockTime = newLockTime;
        emit LockTimeUpdate(newLockTime);
    }
}
