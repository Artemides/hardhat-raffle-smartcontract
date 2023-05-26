// SPDX-License-Identifier: SEE LICENSE IN LICENSE

// create a decentralized lottery
// pick a random winner
// players need a base fee to join
// keep registry of al the participants
//
pragma solidity ^0.8.0;

error Lottery__NotEnoughJoinFee();

contract Lottery {
    uint256 private immutable i_joinFee;
    address payable[] private s_players;

    modifier enoughJoinFee() {
        if (msg.value < i_joinFee) revert Lottery__NotEnoughJoinFee();
        _;
    }

    event LotteryPlayerJoined(address playerAddress);

    constructor(uint256 joinFee) {
        i_joinFee = joinFee;
    }

    function joinLottery() public payable enoughJoinFee {
        s_players.push(payable(msg.sender));

        emit LotteryPlayerJoined(msg.sender);
    }

    function getJoinFee() public view returns (uint256) {
        return i_joinFee;
    }
}
