// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

// the raffle should accept new investors who invoices a certain ammount of ether
// the contract needs to pick automatically a  winner, every x random time forever. with no someones' interaction

//Chainlink oracle -> randomness, automated execution(keepers),

// need at least an entrace fee to join
// keep track of each entering player
// emit and event when a user enters into the raffle

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__NoEnoughStartingFee();

contract Raffle is VRFConsumerBaseV2 {
    uint256 immutable i_entraceFee;
    address payable[] s_players;

    event PlayerJoined(address playerAddress);

    modifier enoughStartingFee() {
        if (msg.value < i_entraceFee) revert Raffle__NoEnoughStartingFee();
        _;
    }

    constructor(address vrfCoordinatorV2, uint256 entraceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entraceFee = entraceFee;
    }

    // create a function to pick the winner
    // Request the random number to VRF
    // once got it make use of it
    // keep in mind that VRF is two transaction process
    function requestRandomNumber() external {}

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {}

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
