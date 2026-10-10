// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

// Local stand-ins for Arc behaviour that stock Foundry does not have. They mirror what was observed on
// Arc mainnet via eth_call (docs/EVIDENCE.md); they are not Arc. Live behaviour is checked by
// scripts/simulate-mainnet.mjs against the real chain.

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function etch(address target, bytes calldata code) external;
    function prank(address sender) external;
    function expectRevert(bytes4 revertData) external;
    function expectRevert(bytes calldata revertData) external;
}

Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

/// Arc USDC ERC-20 at 0x3600…: a 6-decimal view of the 18-decimal native balance. A transfer moves native
/// balance directly and runs no code at the recipient; balanceOf floors sub-10^12-wei dust.
/// Limitation: vm.deal is not undone when the calling frame reverts (real Arc undoes it), so local tests
/// cannot show that VaultChecker leaves balances unchanged; scripts/simulate-mainnet.mjs checks that.
contract MockArcUsdc {
    uint256 constant SCALE = 1e12;

    function balanceOf(address who) external view returns (uint256) {
        return who.balance / SCALE;
    }

    function transfer(address to, uint256 units) external returns (bool) {
        uint256 amount = units * SCALE;
        require(msg.sender.balance >= amount, "insufficient");
        vm.deal(msg.sender, msg.sender.balance - amount);
        vm.deal(to, to.balance + amount);
        return true;
    }
}

/// SLH-DSA precompile at 0x1800…04: returns true only for tuples registered as valid.
contract MockPq {
    mapping(bytes32 => bool) public valid;

    function allow(bytes calldata vk, bytes calldata message, bytes calldata sig) external {
        valid[keccak256(abi.encode(vk, message, sig))] = true;
    }

    function verifySlhDsaSha2128s(bytes calldata vk, bytes calldata message, bytes calldata sig)
        external
        view
        returns (bool)
    {
        return valid[keccak256(abi.encode(vk, message, sig))];
    }
}
