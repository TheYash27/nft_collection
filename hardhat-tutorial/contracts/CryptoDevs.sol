// SPDX-License-Identifier: SEE LICENSE IN LICENSE

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokenURI;
    IWhitelist whitelist;
    bool public presaleStarted;
    uint256 public presaleEnded;
    uint256 public maxTokenIds = 20;
    uint256 public tokenIds;
    uint256 public _price = 0.01 ether;
    bool public _paused;

    modifier onlyWhenNotPaused {
        require(!_paused, "This contract is paused!");
        _;
    } 
    
    constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = (block.timestamp + 5 minutes);
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(whitelist.whitelistedAddresses(msg.sender), "You are NOT eligible to mint in the pre - sale period!");
        require(presaleStarted, "The pre - sale period has NOT yet started!");
        require((block.timestamp <= presaleEnded), "The pre - sale period has ended!");
        require((tokenIds < maxTokenIds), "Uh oh! The max. # pre - sale NFT's that could've been minted has been reached!");
        require(msg.value >= _price, "You do NOT have enough ether to mint a NFT!");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted, "The pre - sale period has NOT yet started!");
        require((block.timestamp <= presaleEnded), "The pre - sale period has NOT ended!");
        require((tokenIds < maxTokenIds), "Uh oh! The max. # NFT's that could've been minted has been reached!");
        require(msg.value >= _price, "You do NOT have enough ether to mint a NFT!");
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Uh oh! ether could not be transferred from this smart contract!");        
    }

    receive() external payable {

    }

    fallback() external payable {

    }
}