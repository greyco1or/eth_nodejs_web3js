import Web3 from "web3";
import erc20Abi from "./erc20.abi.json" assert { type: "json" };

//const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/246a412f52f74832b07b645d3c9b9fed"));
//const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io/v3/246a412f52f74832b07b645d3c9b9fed"));
const web3 = new Web3('https://mainnet.bitonechain.com/');


const contract = new web3.eth.Contract(erc20Abi, "0x51Ee7bB106B581f7cdDab5fA1e9B8A4F4eBca565");

const result = await contract.methods.name().call();
const result2 = await contract.methods.decimals().call();
console.log(result);
console.log(result2);