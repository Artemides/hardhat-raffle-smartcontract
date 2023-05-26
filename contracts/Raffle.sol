// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

// the raffle should accept new investors who invoices a certain ammount of ether
// the contract needs to pick automatically a  winner, every x random time forever. with no someones' interaction

//Chainlink oracle -> randomness, automated execution(keepers),

// need at least an entrace fee to join
// keep track of each entering player
// emit and event when a user enters into the raffle

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
error Raffle__NoEnoughStartingFee();
error Raffle__WinnerTransferFailed();
error Raffle__NotOpen();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum RaffleState {
        OPEN,
        CALCULATING_WINNER
    }

    uint256 private immutable i_entraceFee;
    address payable[] s_players;
    VRFCoordinatorV2Interface private i_vrfCoordinatorV2;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint8 private constant REQUEST_CONFIRMATIONS = 5;
    uint32 private immutable i_callbackGasLimit;
    uint8 private constant NUM_WORDS = 1;
    address private s_lastWinner;
    uint256 private immutable i_raffleInterval;
    uint256 private s_lastRaffleInterval;
    RaffleState private s_raffleSate;

    event RafflePlayerJoined(address playerAddress);
    event RaffleRequestWinner(uint256 requestId);
    event WinnerPicked(address indexed winnerAddress);

    modifier enoughStartingFee() {
        if (msg.value < i_entraceFee) revert Raffle__NoEnoughStartingFee();
        _;
    }

    modifier onlyOpenRaffle() {
        if (s_raffleSate != RaffleState.OPEN) revert Raffle__NotOpen();
        _;
    }

    constructor(
        address vrfCoordinatorV2,
        uint256 entraceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 raffleInterval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entraceFee = entraceFee;
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_raffleInterval = raffleInterval;
        s_lastRaffleInterval = block.timestamp;
    }

    function joinRaffle() public payable onlyOpenRaffle enoughStartingFee {
        s_players.push(payable(msg.sender));

        emit RafflePlayerJoined(msg.sender);
    }

    function requestRandomNumber() external {
        s_raffleSate = RaffleState.CALCULATING_WINNER;
        uint256 requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RaffleRequestWinner(requestId);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external override returns (bool upkeepNeeded, bytes memory /* performData */) {
        upkeepNeeded = isUpkeepNeeded();
    }

    function performUpkeep(bytes calldata performData) external override {}

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 winnerIndex = randomWords[0] % s_players.length;
        s_lastWinner = s_players[winnerIndex];
        (bool transfered, ) = s_lastWinner.call{value: address(this).balance}("");
        if (!transfered) revert Raffle__WinnerTransferFailed();

        s_raffleSate = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastRaffleInterval = block.timestamp;
        emit WinnerPicked(s_lastWinner);
    }

    function isUpkeepNeeded() internal view returns (bool upKeepNeeded) {
        upKeepNeeded =
            isRaffleState(RaffleState.OPEN) &&
            thereIsPlayers() &&
            withBalance() &&
            intervalReached();
    }

    function getEntraceFee() public view returns (uint256) {
        return i_entraceFee;
    }

    function getPlayer(uint256 playerIndex) public view returns (address) {
        return s_players[playerIndex];
    }

    function isRaffleState(RaffleState raffleSate) internal view returns (bool) {
        return raffleSate == s_raffleSate;
    }

    function withBalance() internal view returns (bool) {
        return address(this).balance > 0;
    }

    function intervalReached() internal view returns (bool) {
        return (block.timestamp - s_lastRaffleInterval) > i_raffleInterval;
    }

    function thereIsPlayers() internal view returns (bool) {
        return s_players.length > 0;
    }

    receive() external payable {
        joinRaffle();
    }

    fallback() external payable {
        joinRaffle();
    }
}
