// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
/* solhint-disable no-console */

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/Hololocker.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}

contract HololockerTest is Test {
    event Lock(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event Unlock(address indexed token, address indexed owner, uint256 tokenId, address operator, uint256 unlockTime);
    event Withdraw(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event LockTimeUpdate(uint256 newValue);

    Hololocker hololocker;
    MockNFT mockNFT;
    address token;
    uint256 tokenId;
    address alice = makeAddr("alice");
    uint256 maxLockTime;

    function setUp() public {
        hololocker = new Hololocker(1 minutes);
        mockNFT = new MockNFT("X", "Y");
        tokenId = 0;
        token = address(mockNFT);
        mockNFT.mint(address(this), tokenId);
        mockNFT.setApprovalForAll(address(hololocker), true);
        maxLockTime = hololocker.MAXIMUM_LOCK_TIME();
    }

    function requestUnlockAndWithdrawAndAssert(address owner_, address operator_) public {
        (uint256 unlockTime, address owner, address operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, 0);
        assertEq(owner, owner_);
        assertEq(operator, operator_);
        assertEq(mockNFT.ownerOf(tokenId), address(hololocker));

        vm.roll(block.number + 10);
        vm.expectEmit(true, true, true, true);
        emit Unlock(token, owner, tokenId, operator, block.timestamp + hololocker.lockTime());
        hololocker.requestUnlock(token, tokenId);
        (unlockTime, owner, operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, block.timestamp + hololocker.lockTime());
        assertEq(owner, owner_);
        assertEq(operator, operator_);

        vm.warp(block.timestamp + hololocker.lockTime());
        vm.expectEmit(true, true, true, true);
        emit Withdraw(token, owner, tokenId, operator);
        hololocker.withdraw(token, tokenId);
        (unlockTime, owner, operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, 0);
        assertEq(owner, address(0));
        assertEq(operator, address(0));
        assertEq(mockNFT.ownerOf(tokenId), owner_);
    }

    function test_LockByLockFunction() public {
        vm.expectEmit(true, true, true, true);
        emit Lock(token, address(this), tokenId, address(this));
        hololocker.lock(token, tokenId);
        requestUnlockAndWithdrawAndAssert(address(this), address(this));
    }

    function test_LockBySafeTransfer() public {
        vm.expectEmit(true, true, true, true);
        emit Lock(token, address(this), tokenId, address(this));
        ERC721(token).safeTransferFrom(address(this), address(hololocker), tokenId, "");
        requestUnlockAndWithdrawAndAssert(address(this), address(this));
    }

    function test_LockByOperatorSafeTransfer() public {
        mockNFT.setApprovalForAll(alice, true);
        vm.startPrank(alice);
        vm.expectEmit(true, true, true, true);
        emit Lock(token, address(this), tokenId, alice);
        ERC721(token).safeTransferFrom(address(this), address(hololocker), tokenId, "");
        requestUnlockAndWithdrawAndAssert(address(this), alice);
    }

    function test_SetLockTime() public {
        uint256 newValue = maxLockTime - 10;
        vm.expectEmit(true, true, true, true);
        emit LockTimeUpdate(newValue);
        hololocker.setLockTime(newValue);
        assertEq(hololocker.lockTime(), newValue);
    }

    function test_CannotRequestUnlockMultipleTimes() public {
        hololocker.lock(token, tokenId);
        hololocker.requestUnlock(token, tokenId);
        vm.expectRevert(Hololocker.UnlockAlreadyRequested.selector);
        hololocker.requestUnlock(token, tokenId);
    }

    function test_CannotRequestUnlockUnauthorized() public {
        hololocker.lock(token, tokenId);
        vm.prank(alice);
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.requestUnlock(token, tokenId);
    }

    function test_CannotRequestUnlockWithoutLocking() public {
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.requestUnlock(token, tokenId);
    }

    function test_CannotWithdrawUnauthorized() public {
        hololocker.lock(token, tokenId);
        hololocker.requestUnlock(token, tokenId);
        vm.warp(block.timestamp + hololocker.lockTime());
        vm.prank(alice);
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.withdraw(token, tokenId);
    }

    function test_CannotWithdrawWithoutUnlocking() public {
        hololocker.lock(token, tokenId);
        vm.expectRevert(Hololocker.NotUnlockedYet.selector);
        hololocker.withdraw(token, tokenId);
    }

    function test_CannotWithdrawIfUnlockTimeNotReached() public {
        hololocker.lock(token, tokenId);
        hololocker.requestUnlock(token, tokenId);
        vm.warp(block.timestamp + hololocker.lockTime() - 1);
        vm.expectRevert(Hololocker.NotUnlockedYet.selector);
        hololocker.withdraw(token, tokenId);
    }

    function test_CannotSetLockTimeInvalid() public {
        vm.expectRevert(Hololocker.InvalidLockTime.selector);
        hololocker.setLockTime(maxLockTime + 1);
    }

    function test_CannotSetLockTimeUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        hololocker.setLockTime(maxLockTime);
    }
}
