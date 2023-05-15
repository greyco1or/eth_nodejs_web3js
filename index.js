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
            console.log("########################## Transaction Info Start ########################")
            let txId = result.transactionHash;
            //console.log(`Block Number: ${result.blockNumber}`);
            console.log(`Transaction log Index: ${result.logIndex}`);
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction Index: ${result.transactionIndex}`);
            console.log("########################## Transaction Info Finish ########################")
            getReciptData(txId);
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
}

async function getReciptData(txId) {
    web3.eth.getTransactionReceipt(txId).then((txReceipt) => {
        let logs = txReceipt.logs;
        for(let log of logs) {
            var topics = log.topics;
            if (topics[0]=="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                console.log("################# TRANSACTION RECEIPT START ####################");
                console.log(`Transaction Hash: ${txId}`);
                let fromAddr = web3.utils.toChecksumAddress('0x' + topics[1].substring(26));
                let toAddr = web3.utils.toChecksumAddress('0x' + topics[2].substring(26));
                let tokenValue = web3.utils.hexToNumberString(log.data);
                let gasFee = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
                let contractAddress = log.address;
                const contract = new web3.eth.Contract(erc20Abi, contractAddress);
                //contract.methods.name().call().then((_tokenName) => console.log(_tokenName));
                //contract.methods.decimals().call().then((_tokenDecimal) => tokenDecimal = _tokenDecimal);
                getSmartContractData(contract).then((tokenObj) => {
                    console.log(`Transaction From Address: ${fromAddr}`);
                    console.log(`Transaction To Address: ${toAddr}`);
                    console.log(`Transaction SmartContract Address: ${contractAddress}`);
                    console.log(`Transaction Token Name: ${tokenObj.tokenName}`);
                    console.log(`Transaction Token Value: ${tokenValue / (10 ** tokenObj.tokenDecimal)}`);
                    console.log(`Transaction Gas Fee: ${web3.utils.fromWei(gasFee.toString(), 'ether')} ETH`);
                    console.log("################### TRANSACTION RECEIPT FINISH #################");
                })
            }
        }
    })
}

async function getSmartContractData(contract) {
    class tokenData {
        constructor(tokenName, tokenDecimal) {
            this.tokenName = tokenName;
            this.tokenDecimal = tokenDecimal;
        }
    }
    let tokenName = await contract.methods.name().call();
    let tokenDecimal = await contract.methods.decimals().call();

    let tokenObj = new tokenData(tokenName, tokenDecimal);

    return tokenObj;
}   

Subscribe();