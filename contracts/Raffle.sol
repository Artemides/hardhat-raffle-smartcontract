// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

// the raffle should accept new investors who invoices a certain ammount of ether
// the contract needs to pick automatically a  winner, every x random time forever. with no someones' interaction

//Chainlink oracle -> randomness, automated execution(keepers),

// need at least an entrace fee to join
// keep track of each entering player
// emit and event when a user enters into the raffle

error Raffle__NoEnoughStartingFee();

contract Raffle {
    uint256 immutable i_entraceFee;
    address payable[] s_players;

    event PlayerJoined(address playerAddress);

    modifier enoughStartingFee() {
        if (msg.value < i_entraceFee) revert Raffle__NoEnoughStartingFee();
        _;
    }

    constructor(uint256 entraceFee) {
        i_entraceFee = entraceFee;
    }

    function joinRaffle() public payable enoughStartingFee {
        s_players.push(payable(msg.sender));

        emit PlayerJoined(msg.sender);
    }

    function getEntraceFee() public view returns (uint256) {
        return i_entraceFee;
    }

    function getPlayer(uint256 playerIndex) public view returns (address) {
        return s_players[playerIndex];
    }

    receive() external payable {
        joinRaffle();
    }

    fallback() external payable {
        joinRaffle();
    }
}
