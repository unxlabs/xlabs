// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UnlimitedGenesisPass is
    ERC1155,
    ERC1155Supply,
    ERC1155Pausable,
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ------------------------------------------------------------
    // Collection
    // ------------------------------------------------------------

    string public constant name = "Unlimited Genesis Pass";
    string public constant symbol = "UXG";

    // ------------------------------------------------------------
    // Genesis Pass
    // ------------------------------------------------------------

    uint256 public constant GENESIS_PASS_ID = 1;
    uint256 public constant MAX_SUPPLY = 10_000;

    // BSC USDT uses 18 decimals
    // 1.30 USDT = 1.3 * 10^18
    uint256 public constant PRICE = 1.3 ether;

    // ------------------------------------------------------------
    // Payment
    // ------------------------------------------------------------

    IERC20 public immutable paymentToken;

    address public treasury;

    // ------------------------------------------------------------
    // Metadata
    // ------------------------------------------------------------

    string private _genesisMetadataURI;

    // ------------------------------------------------------------
    // Events
    // ------------------------------------------------------------

    event GenesisPassMinted(
        address indexed buyer,
        uint256 quantity,
        uint256 totalPaid
    );

    event TreasuryUpdated(
        address indexed previousTreasury,
        address indexed newTreasury
    );

    event GenesisMetadataUpdated(
        string previousURI,
        string newURI
    );

    // ------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------

    constructor(
        address paymentToken_,
        address treasury_,
        string memory metadataURI_
    )
        ERC1155("")
        Ownable(msg.sender)
    {
        require(paymentToken_ != address(0), "Invalid payment token");
        require(treasury_ != address(0), "Invalid treasury");
        require(bytes(metadataURI_).length > 0, "Invalid metadata URI");

        paymentToken = IERC20(paymentToken_);
        treasury = treasury_;
        _genesisMetadataURI = metadataURI_;

        // Helps indexers discover the metadata URI immediately.
        emit URI(metadataURI_, GENESIS_PASS_ID);
    }

    // ------------------------------------------------------------
    // Mint
    // ------------------------------------------------------------

    function mint(
        uint256 quantity
    )
        external
        nonReentrant
        whenNotPaused
    {
        require(quantity > 0, "Quantity must be greater than zero");

        require(
            totalSupply(GENESIS_PASS_ID) + quantity <= MAX_SUPPLY,
            "Genesis supply exceeded"
        );

        uint256 totalCost = PRICE * quantity;

        paymentToken.safeTransferFrom(
            msg.sender,
            treasury,
            totalCost
        );

        _mint(
            msg.sender,
            GENESIS_PASS_ID,
            quantity,
            ""
        );

        emit GenesisPassMinted(
            msg.sender,
            quantity,
            totalCost
        );
    }

    // ------------------------------------------------------------
    // Metadata
    // ------------------------------------------------------------

    function uri(
        uint256 tokenId
    )
        public
        view
        override
        returns (string memory)
    {
        require(
            tokenId == GENESIS_PASS_ID,
            "Invalid token ID"
        );

        return _genesisMetadataURI;
    }

    function setGenesisMetadataURI(
        string calldata newURI
    )
        external
        onlyOwner
    {
        require(
            bytes(newURI).length > 0,
            "Invalid metadata URI"
        );

        string memory previousURI =
            _genesisMetadataURI;

        _genesisMetadataURI = newURI;

        emit GenesisMetadataUpdated(
            previousURI,
            newURI
        );

        // ERC-1155 standard metadata notification
        emit URI(
            newURI,
            GENESIS_PASS_ID
        );
    }

    // ------------------------------------------------------------
    // Supply / User Data
    // ------------------------------------------------------------

    function remainingSupply()
        external
        view
        returns (uint256)
    {
        return
            MAX_SUPPLY -
            totalSupply(GENESIS_PASS_ID);
    }

    function passesOf(
        address account
    )
        external
        view
        returns (uint256)
    {
        return
            balanceOf(
                account,
                GENESIS_PASS_ID
            );
    }

    // ------------------------------------------------------------
    // Treasury
    // ------------------------------------------------------------

    function setTreasury(
        address newTreasury
    )
        external
        onlyOwner
    {
        require(
            newTreasury != address(0),
            "Invalid treasury"
        );

        address previousTreasury =
            treasury;

        treasury = newTreasury;

        emit TreasuryUpdated(
            previousTreasury,
            newTreasury
        );
    }

    // ------------------------------------------------------------
    // Emergency Controls
    // ------------------------------------------------------------

    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    function unpause()
        external
        onlyOwner
    {
        _unpause();
    }

    // ------------------------------------------------------------
    // OpenZeppelin Overrides
    // ------------------------------------------------------------

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    )
        internal
        override(
            ERC1155,
            ERC1155Supply,
            ERC1155Pausable
        )
    {
        super._update(
            from,
            to,
            ids,
            values
        );
    }
}