// SPDX-License-Identifier: SEE LICENSE IN LICENSE

// create a decentralized lottery
// pick a random winner
// players need a base fee to join
// keep registry of al the participants
//
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Lottery__NotEnoughJoinFee();
error Lottery__WinnerTransactionFailed(address winnerAddress);
error Lottery__NotOpen();
error Lottery__NotLotteryIntervalReached(uint256 remainingTime);

contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum LotteryState {
        OPEN,
        GETTING_WINNER
    }

    uint256 private immutable i_joinFee;
    address payable[] private s_players;
    address private s_lastWinner;
    LotteryState public s_lotteryState;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint8 private constant REQUEST_CONFIRMATIONS = 5;
    uint8 private constant NUM_WORDS = 1;
    uint32 private immutable i_callbackGasLimit;
    uint256 private s_lastLotteryInterval;
    uint256 private immutable i_lotteryInterval;
    modifier enoughJoinFee() {
        if (msg.value < i_joinFee) {
            revert Lottery__NotEnoughJoinFee();
        }
        _;
    }

    modifier onlyLotteryOpen() {
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        _;
    }

    event LotteryPlayerJoined(address playerAddress);
    event LotteryRandomWinnerRequested(uint256 requestId);
    event LotteryWinnerSelected(address winnerAddress);

    constructor(
        address vrfCoordinatorV2,
        uint256 joinFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 lotteryInterval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_joinFee = joinFee;
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_lastLotteryInterval = block.timestamp;
        i_lotteryInterval = lotteryInterval;
    }

    function joinLottery() public payable onlyLotteryOpen enoughJoinFee {
        s_players.push(payable(msg.sender));

        emit LotteryPlayerJoined(msg.sender);
    }

    //request a random number between automatic intervals
    function checkUpkeep(
        bytes calldata /* checkData */
    ) public view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = isUpkeepNeeded();
        performData = "";
    }

    function performUpkeep(bytes calldata) external override {
        uint256 remainingInterval = block.timestamp - s_lastLotteryInterval;
        if (!isUpkeepNeeded()) revert Lottery__NotLotteryIntervalReached(remainingInterval);

        s_lotteryState = LotteryState.GETTING_WINNER;

        uint256 requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit LotteryRandomWinnerRequested(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 winnerIndex = randomWords[0] % getNumberOfPlayers();
        s_lastWinner = s_players[winnerIndex];
        (bool transfered, ) = s_lastWinner.call{value: address(this).balance}("");
        if (!transfered) revert Lottery__WinnerTransactionFailed(s_lastWinner);

        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastLotteryInterval = block.timestamp;
        emit LotteryWinnerSelected(s_lastWinner);
    }

    function isUpkeepNeeded() internal view returns (bool upKeepNeeded) {
        upKeepNeeded =
            isRaffleState(LotteryState.OPEN) &&
            thereIsPlayers() &&
            withBalance() &&
            intervalReached();
    }

    function getEntraceFee() public view returns (uint256) {
        return i_joinFee;
    }

    function isRaffleState(LotteryState raffleSate) internal view returns (bool) {
        return raffleSate == s_lotteryState;
    }

    function withBalance() internal view returns (bool) {
        return address(this).balance > 0;
    }

    function intervalReached() internal view returns (bool) {
        return (block.timestamp - s_lastLotteryInterval) > i_lotteryInterval;
    }

    function thereIsPlayers() internal view returns (bool) {
        return s_players.length > 0;
    }

    function getJoinFee() public view returns (uint256) {
        return i_joinFee;
    }

    function getPlayer(uint256 playerIndex) public view returns (address) {
        return s_players[playerIndex];
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
