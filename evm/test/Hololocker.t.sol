// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Hololocker.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}

contract HololockerTest is Test {
    Hololocker hololocker;
    MockNFT mockNFT;
    address token;
    uint256 tokenId;
    address alice = makeAddr("alice");

    function setUp() public {
        hololocker = new Hololocker();
        mockNFT = new MockNFT("X", "Y");
        tokenId = 0;
        token = address(mockNFT);
        mockNFT.mint(address(this), tokenId);
        mockNFT.setApprovalForAll(address(hololocker), true);
    }

    function requestUnlockAndWithdrawAndAssert() public {
        (uint256 unlockTime, address owner, address operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, 0);
        assertEq(owner, address(this));
        assertEq(operator, address(this));
        assertEq(mockNFT.ownerOf(tokenId), address(hololocker));

        vm.roll(block.number + 10);
        hololocker.requestUnlock(token, tokenId);
        (unlockTime, owner, operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, block.number + hololocker.lockTime());
        assertEq(owner, address(this));
        assertEq(operator, address(this));

        vm.roll(block.number + hololocker.lockTime());
        hololocker.withdraw(token, tokenId);
        (unlockTime, owner, operator) = hololocker.nftLockInfo(token, tokenId);
        assertEq(unlockTime, 0);
        assertEq(owner, address(0));
        assertEq(operator, address(0));
        assertEq(mockNFT.ownerOf(tokenId), address(this));
    }

    function test_LockByLockFunction() public {
        hololocker.lock(token, tokenId);
        requestUnlockAndWithdrawAndAssert();
    }

    function test_LockBySafeTransfer() public {
        ERC721(token).safeTransferFrom(address(this), address(hololocker), tokenId, "");
        requestUnlockAndWithdrawAndAssert();
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
        vm.roll(block.number + hololocker.lockTime());
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
        vm.roll(block.number + hololocker.lockTime() - 1);
        vm.expectRevert(Hololocker.NotUnlockedYet.selector);
        hololocker.withdraw(token, tokenId);
    }

    function test_CannotSetLockTimeInvalid() public {
        vm.expectRevert(Hololocker.InvalidLockTime.selector);
        hololocker.setLockTime(1);
    }

    function test_CannotSetLockTimeUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        hololocker.setLockTime(100);
    }
}
