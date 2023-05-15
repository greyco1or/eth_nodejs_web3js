import Web3 from "web3";
import erc20Abi from "./erc20.abi.json" assert { type: "json" };

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/246a412f52f74832b07b645d3c9b9fed"));

const transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
let tokenSmartContract = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

function Subscribe() {
    web3.eth.subscribe('logs', {
        address: tokenSmartContract,
        topics: [transfer_topic]
    }, (err, result) => {
        if(err) {
            console.error(err);
        } else {
            console.log("########################## Transaction Log Info Start ########################")
            let txId = result.transactionHash;
            console.log(`Block Number: ${result.blockNumber}`);
            console.log(`Transaction log Index: ${result.logIndex}`);
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction Index: ${result.transactionIndex}`);
            getReciptData(txId);
            console.log("########################## Transaction Log Info Finish ########################");
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
}

async function getReciptData(txId) {
    const txReceipt = await web3.eth.getTransactionReceipt(txId);
    const { logs } = txReceipt;
    logs.map(async ({ topics, address, data }) => {
        if (topics[0]=="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            const fromAddr = web3.utils.toChecksumAddress("0x" + topics[1].substring(26));
            const toAddr = web3.utils.toChecksumAddress("0x" + topics[2].substring(26));
            const tokenValue = web3.utils.hexToNumberString(data);
            const gasFee = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
            const contract = new web3.eth.Contract(erc20Abi, address);
            const tokenObj = await getSmartContractData(contract);
            console.log("################# TRANSACTION RECEIPT START ####################");
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction From Address: ${fromAddr}`);
            console.log(`Transaction To Address: ${toAddr}`);
            console.log(`Transaction SmartContract Address: ${address}`);
            console.log(`Transaction Token Name: ${tokenObj.tokenName}`);
            console.log(`Transaction Token Value: ${tokenValue / 10 ** tokenObj.tokenDecimal}`);
            console.log(`Transaction Gas Fee: ${web3.utils.fromWei(gasFee.toString(), "ether")} ETH`);
            console.log("################### TRANSACTION RECEIPT FINISH #################");
        }
    });
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