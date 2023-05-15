import Web3 from "web3";
import erc20Abi from "./erc20.abi.json" assert { type: "json" };

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/246a412f52f74832b07b645d3c9b9fed"));
//const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io/v3/246a412f52f74832b07b645d3c9b9fed"));
//const web3 = new Web3('https://mainnet.bitonechain.com/');

function Subscribe() {
    web3.eth.subscribe('logs', {}, (err, result) => {
        if(err) {
            console.error(err);
        } else {
            let txId = result.transactionHash;
            /*
            console.log("########################## Transaction Log Info Start ########################")
            console.log(`Block Number: ${result.blockNumber}`);
            console.log(`Transaction log Index: ${result.logIndex}`);
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction Index: ${result.transactionIndex}`);
            console.log("########################## Transaction Log Info Finish ########################");
            */
           getReciptData(txId);
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
}

async function getReciptData(txId) {
    const tx = await web3.eth.getTransaction(txId);
    const { input } = tx;
    if (input == undefined || input == "0x") {
        const fromAddr = tx.from;
        const toAddr = tx.to;
        const gasFee = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
        const coinValue = web3.utils.fromWei(tx.value.toString(), "ether")
        console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER START @@@@@@@@@@@@@@@@@");
        console.log(`Transaction Hash: ${tx.hash}`);
        console.log(`Transaction From Address: ${fromAddr}`);
        console.log(`Transaction To Address: ${toAddr}`);
        console.log(`Transaction Coin Name: ETH`);
        console.log(`Transaction Coin Value: ${coinValue} ETH`);
        console.log(`Transaction Gas Fee: ${web3.utils.fromWei(gasFee.toString(), "ether")} ETH`);
        console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER FINISH @@@@@@@@@@@@@@@@@");
    }
    
}

async function getSmartContractData(contract) {
    class tokenData {
        constructor(tokenName, tokenDecimal) {
            this.tokenName = tokenName;
            this.tokenDecimal = tokenDecimal;
        }
    }
    const tokenName = await contract.methods.name().call();
    const tokenDecimal = await contract.methods.decimals().call();

    const tokenObj = new tokenData(tokenName, tokenDecimal);

    return tokenObj;
}   

Subscribe();

/*
const contract = new web3.eth.Contract(erc20Abi, "0x51Ee7bB106B581f7cdDab5fA1e9B8A4F4eBca565");

const result = await contract.methods.name().call();
const result2 = await contract.methods.decimals().call();
console.log(result);
console.log(result2);
*/
