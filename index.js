import Web3 from "web3";
import erc20Abi from "./erc20.abi.json" assert { type: "json" };
import kafka from "kafka-node";

class TxOfBlock {
    constructor(transactionHash, block, fromAddr, toAddr, tokenVolume, coinVolume, gasPrice, tokenContractAddr, timeStamp) {
        this.transactionHash = transactionHash;
        this.block = block;
        this.fromAddr = fromAddr;
        this.toAddr = toAddr;
        this.tokenVolume = tokenVolume;
        this.coinVolume = coinVolume;
        this.gasPrice = gasPrice;
        this.tokenContractAddr = tokenContractAddr;
        this.timeStamp = timeStamp;
    }
}

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/246a412f52f74832b07b645d3c9b9fed"));

function Subscribe() {
    let txId = "";
    web3.eth.subscribe('logs', {}, (err, result) => {
        if(err) {
            console.error(err);
        } else {
            if(txId == result.transactionHash) {
                return;
            } else {
                txId = result.transactionHash;
                getReciptData(txId);
            }
            
            /*
            console.log("########################## Transaction Log Info Start ########################")
            console.log(`Block Number: ${result.blockNumber}`);
            console.log(`Transaction log Index: ${result.logIndex}`);
            console.log(`Transaction Hash: ${txId}`);
            console.log(`Transaction Index: ${result.transactionIndex}`);
            console.log("########################## Transaction Log Info Finish ########################");
            */
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
}

async function getReciptData(txId) {
    const tx = await web3.eth.getTransaction(txId);
    const txReceipt = await web3.eth.getTransactionReceipt(txId);
    const { input } = tx;
    if (input == undefined || input == "0x") {
        const fromAddr = tx.from;
        const toAddr = tx.to;
        const gasPrice = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
        const coinValue = web3.utils.fromWei(tx.value.toString(), "ether");
        let txEthInfo = new TxOfBlock();
        txEthInfo.fromAddr = fromAddr;
        txEthInfo.toAddr = toAddr;
        txEthInfo.gasPrice = web3.utils.fromWei(gasPrice.toString(), "ether");
        txEthInfo.coinVolume = coinValue;
        txEthInfo.tokenContractAddr = "ETH";
        txEthInfo.block = tx.blockNumber; 
        txEthInfo.transactionHash = tx.hash;
        const client = new kafka.KafkaClient({ kafkaHost: '59.10.9.149:9092' });
        const producer = new kafka.Producer(client);
        let payloads = [
            { topic: 'hello.kafka', messages: JSON.stringify(txEthInfo), key: 'ETH'}
        ]; 
        producer.send(payloads, function(err, data) {
            if (err) {
                console.log('Error:', err);
            } else {
                console.log('Sent:', data);
                client.close();
            }
        });
        console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER START @@@@@@@@@@@@@@@@@");
        console.log(`Block Number: ${tx.blockNumber}`);
        console.log(`Transaction Hash: ${tx.hash}`);
        console.log(`Transaction From Address: ${fromAddr}`);
        console.log(`Transaction To Address: ${toAddr}`);
        console.log(`Transaction Coin Name: ETH`);
        console.log(`Transaction Coin Value: ${coinValue} ETH`);
        console.log(`Transaction Gas Fee: ${web3.utils.fromWei(gasPrice.toString(), "ether")} ETH`);
        console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER FINISH @@@@@@@@@@@@@@@@@");
    } else {
        if(txReceipt.logs != null) {
            const { logs } = txReceipt;
            logs.map(async ({ topics, address, data }) => {
                if (topics[0]=="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                    let fromAddr = "";
                    let toAddr = "";
                    if(topics[1] != undefined) {
                        fromAddr = web3.utils.toChecksumAddress("0x" + topics[1].substring(26));
                    } else {
                        fromAddr = topics[1];
                    }
                    if(topics[2] != undefined) {
                        toAddr = web3.utils.toChecksumAddress("0x" + topics[2].substring(26));
                    } else {
                        toAddr = topics[2];
                    }
                    const tokenValue = web3.utils.hexToNumberString(data);
                    const gasPrice = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
                    const contract = new web3.eth.Contract(erc20Abi, address);
                    const coinValue = web3.utils.fromWei(tx.value.toString(), "ether");
                    let txInfo = new TxOfBlock();
                    txInfo.fromAddr = fromAddr;
                    txInfo.toAddr = toAddr;
                    txInfo.gasPrice = web3.utils.fromWei(gasPrice.toString(), "ether");
                    txInfo.coinVolume = coinValue;
                    txInfo.tokenVolume = tokenValue;
                    txInfo.tokenContractAddr = address;
                    txInfo.block = txReceipt.blockNumber; 
                    txInfo.transactionHash = txReceipt.hash;
                    const client = new kafka.KafkaClient({ kafkaHost: '59.10.9.149:9092' });
                    const producer = new kafka.Producer(client);
                    let payloads = [
                        { topic: 'hello.kafka', messages: JSON.stringify(txInfo), key: 'ETH'}
                    ]; 
                    producer.send(payloads, function(err, data) {
                        if (err) {
                            console.log('Error:', err);
                        } else {
                            console.log('Sent:', data);
                            client.close();
                        }
                    });
                    //const tokenObj = await getSmartContractData(contract);
                    console.log("################# TRANSACTION RECEIPT(TOKEN) START ####################");
                    console.log(`Block Number: ${tx.blockNumber}`);
                    console.log(`Transaction Hash: ${tx.hash}`);
                    console.log(`Transaction From Address: ${fromAddr}`);
                    console.log(`Transaction To Address: ${toAddr}`);
                    console.log(`Transaction SmartContract Address: ${address}`);
                    console.log(`Transaction Coin Value: ${coinValue} ETH`);
                    console.log(`Transaction Token Value: ${tokenValue}`);
                    //console.log(`Transaction Token Name: ${tokenObj.tokenName}`);
                    //console.log(`Transaction Token Value: ${tokenValue / 10 ** tokenObj.tokenDecimal}`);
                    console.log(`Transaction Gas Fee: ${web3.utils.fromWei(gasPrice.toString(), "ether")} ETH`);
                    console.log("################### TRANSACTION RECEIPT(TOKEN) FINISH #################");
                }
            });
        }
    }
}

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
    //const tokenSymbol = await contract.methods.symbol().call();
    const tokenObj = new tokenData(tokenName, tokenDecimal);
    return tokenObj;
}   

Subscribe();

