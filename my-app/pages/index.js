import { Contract, ethers, utils } from 'ethers';
import { useState, useRef, useEffect } from 'react';
import Web3Modal from 'web3modal';
import styles from '../styles/Home.module.css';
import Head from 'next/head';
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../constants';
import { get } from 'cheerio/lib/api/traversing';

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const presaleMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      })
      await txn.wait();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const publicMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01")
      })
      await txn.wait();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();
      
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const startPresale = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));

      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.error(error);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 5) {
      window.alert("Kindly switch to the Goerli Test Network to connect to this page");
      throw new Error("Kindly switch to the Goerli Test Network to connect to this page");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    setInterval(async() => {
      await getNumMintedTokens();
    }, 5000);

    setInterval(async() => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5000);
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false
      })
      onPageLoad();
    }
  });

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          connect wallet!
        </button>
      )
    }

    if (loading) {
      return (
        <span className={styles.description}>
          Loading....
        </span>
      )
    }

    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          begin pre - sale!
        </button>
      )
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            pre - sale period has NOT yet started!
          </span>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <button className={styles.button} onClick={presaleMint}>
            pre - sale mint!
          </button>
        </div>
      )
    }

    if (presaleEnded) {
      return (
        <div>
          <button className={styles.button} onClick={publicMint}>
            open mint!
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to my CryptoDevs NFT Collection!</h1>
          <div className={styles.description}>
            CryptoDevs is a NFT collection for Web3 developers
          </div>
          <div>
            {numTokensMinted} / 20 CryptoDevs NFTs have already been minted!
          </div>
          {renderBody()}
        </div>
      </div>
    </div>
  )
}
