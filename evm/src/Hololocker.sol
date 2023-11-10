// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HololockerInterface.sol";

contract Hololocker is HololockerInterface, Ownable {
    /// Upper limit for lockTime
    uint256 public constant MAXIMUM_LOCK_TIME = 1 days;

    /// Delay that has to pass from unlocking until NFT can be withdrawn
    uint256 public lockTime;

    // NFT address => NFT ID => LockInfo
    mapping(address => mapping(uint256 => LockInfo)) public nftLockInfo;

    error InvalidLockTime();
    error NotUnlockedYet();
    error Unauthorized();
    error UnlockAlreadyRequested();
    error InvalidInputArity();

    constructor(uint256 lockTime_, address owner_) {
        lockTime = lockTime_;
        _transferOwnership(owner_);
    }

    /// @notice Returns `LockInfo` for specified `token => tokenId`
    /// @param token NFT tokens contract address
    /// @param tokenId NFT tokens identifier
    /// @return The `LockInfo` struct information
    function getLockInfo(address token, uint256 tokenId) external view returns (LockInfo memory) {
        return nftLockInfo[token][tokenId];
    }

    /// @notice Initiates a lock for one or more NFTs
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Stores a `LockInfo` struct `{owner: owner, operator: msg.sender, unlockTime: 0}` for each `token => tokenId`
    /// Emits `Lock` event.
    /// Transfers each token:tokenId to this contract.
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
    /// @param owner NFT tokens owner
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

    /// @notice Requests unlock for one or more NFTs
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Reverts if msg.sender is neither `owner` nor `operator` of LockInfo struct for
    /// any of the input tokens.
    /// Reverts if `unlockTime` of LockInfo struct for any of the input tokens is not 0.
    /// Modifies a `LockInfo` struct `{unlockTime: block.timestamp + lockTime}` for each `token => tokenId`
    /// Emits `Unlock` event.
    /// Since only authorized user can use this function, it cannot be used without locking NFT beforehand,
    /// because both info.owner and info.operator would be address(0)
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
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

    /// @notice Withdraws one or more NFTs to their rightful owner
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Reverts if msg.sender is neither `owner` nor `operator` of LockInfo struct for
    /// any of the input tokens.
    /// Reverts if `unlockTime` of LockInfo struct for any of the input tokens is
    /// either 0 or greater than block.timestamp.
    /// Modifies a `LockInfo` struct `{unlockTime: block.timestamp + lockTime}` for each `token => tokenId`
    /// Emits `Unlock` event.
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
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

    /// @notice Changes `lockTime` variable that is used in `requestUnlock`.
    /// @dev Reverts if new value is greater than `MAXIMUM_LOCK_TIME`.
    /// Emits `LockTimeUpdate` event.
    /// @param newLockTime New lockTime value
    function setLockTime(uint256 newLockTime) external onlyOwner {
        if (newLockTime > MAXIMUM_LOCK_TIME) {
            revert InvalidLockTime();
        }
        lockTime = newLockTime;
        emit LockTimeUpdate(newLockTime);
    }

    /// @dev From IERC721Receiver, handles initiating a lock upon direct NFT safeTransferFrom function call
    /// @param operator The address which called `safeTransferFrom` function
    /// @param from The address which previously owned the token
    /// @param tokenId The NFT identifier which is being transferred
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
}
