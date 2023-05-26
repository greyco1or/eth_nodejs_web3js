import Web3 from "web3";
//import erc20Abi from "./erc20.abi.json" assert { type: "json" };

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/246a412f52f74832b07b645d3c9b9fed"));
//const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/246a412f52f74832b07b645d3c9b9fed"));
//const web3 = new Web3('https://mainnet.bitonechain.com/');

async function getTimeStamp() {
    let timeStamp = "";
    let subscription = web3.eth.subscribe('newBlockHeaders', function (err, result) {
        if(err) {
            console.error(err);
        } else {                                                  
            //console.log(`BLOCK TIMESTAMP : ${result.timestamp}, ${new Date()}`);
            let timeStampToDate = new Date(result.timestamp * 1000);
            timeStamp = timeStampToDate.getFullYear() + "-" + (timeStampToDate.getMonth()+1) + "-" + timeStampToDate.getDate() + " " + timeStampToDate.getHours() + ":" + timeStampToDate.getMinutes() + ":" + timeStampToDate.getSeconds();
            console.log(`BLOCK TIMESTAMP : ${timeStamp}, ${new Date()}`);
            //timeStamp = result.timestamp;
        }
    }).on("data", function(blockHeader) {
        subscription.unsubscribe(function(err, success) {
            if(success) {
                console.log("Successfully unsubscribed!");
                Subscribe(timeStamp);
            }
        })
    })
    return new Promise((resolve) => {
        timeStamp;
    });
}

async function Subscribe(timeStamp) {
    let txId = "";
    //let timeStamp = "";
    //timeStamp = getTimeStamp();
    let logSubscription = web3.eth.subscribe('logs', {}, (err, result) => {
        if(err) {
            console.error(err);
        } else {
            if(txId == result.transactionHash) {
                return;
            } else {
                txId = result.transactionHash;
                console.log(`TRANSACTION HASH : ${txId}, ${timeStamp}`);
                //let timeStamp = getTimeStamp();
                //console.log(txId);
                //client.close();
                //getReciptData(txId);
            }
            /*
            console.log("########################## Transaction Log Info Start ########################")
            console.log(`Block Number: ${result.blockNumber}`);
            console.log(`Transaction log Index: ${result.logIndex}`);
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction Index: ${result.transactionIndex}`);
            console.log("########################## Transaction Log Info Finish ########################");
            */
           //getReciptData();
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
    .on("data", function(log){
        console.log(logSubscription);
        logSubscription.unsubscribe(function(error, success){
            if(success) {
                getTimeStamp();
            }
        });
    })
    return new Promise((res) => 1);
}

getTimeStamp();

async function getReciptData() {
    const txId = "0x64ed4d9781a0743c4b5734ba9f42ab0074ba7d1659e79b84d4b85a67a995733b";
    const tx = await web3.eth.getTransaction(txId);
    const txReceipt = await web3.eth.getTransactionReceipt(txId);
    console.log(tx);
    console.log("**********************************************");
    console.log(txReceipt.logs);
    //const tx = await web3.eth.getTransaction(txId);
    //const { input } = tx;
    //if (input == undefined || input == "0x") {
        /*
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
        */
    //}
    
}

/*
async function getSmartContractData(contract) {
    class tokenData {
        constructor(tokenName, tokenDecimal, tokenSymbol) {
            this.tokenName = tokenName;
            this.tokenDecimal = tokenDecimal;
            this.tokenSymbol = tokenSymbol;
        }
    }
    const tokenName = await contract.methods.name().call();
    const tokenDecimal = await contract.methods.decimals().call();
    const tokenSymbol = await contract.methods.symbol().call();

    const tokenObj = new tokenData(tokenName, tokenDecimal);

    return tokenObj;
}   

const contract = new web3.eth.Contract(erc20Abi, "0x2B9a49417F9c9c8Dd18EF5bb37c20637441Ad67a");
const tokenObj = await getSmartContractData(contract);
console.log(tokenObj.tokenSymbol);
console.log(tokenObj.tokenName);
console.log(tokenObj.tokenDecimal);

/*
const contract = new web3.eth.Contract(erc20Abi, "0x51Ee7bB106B581f7cdDab5fA1e9B8A4F4eBca565");

const result = await contract.methods.name().call();
const result2 = await contract.methods.decimals().call();
console.log(result);
console.log(result2);
*/
