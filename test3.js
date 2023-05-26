import Web3 from "web3";
//import erc20Abi from "./erc20.abi.json" assert { type: "json" };
import kafka from "kafka-node";

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/5bae3cbc80ab4700853308ad5e9b4c21"));

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
function getTimeStamp(date){
    var year = date.getFullYear();
    var month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month; // 10이 넘지 않으면 앞에 0을 붙인다
    var day = date.getDate();
    day = day >= 10 ? day : '0' + day; // 10이 넘지 않으면 앞에 0을 붙인다
    var hours = date.getHours();
    hours = hours >= 10 ? hours : '0' + hours; // 10이 넘지 않으면 앞에 0을 붙인다
    var minutes = date.getMinutes();
    minutes =  minutes >= 10 ? minutes : '0' + minutes; // 10이 넘지 않으면 앞에 0을 붙인다
    var seconds = date.getSeconds();
    seconds = seconds >= 10 ? seconds : '0' + seconds; // 10이 넘지 않으면 앞에 0을 붙인다
 
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} `
}

function Subscribe() {
    web3.eth.subscribe('newBlockHeaders', (err, result) => {
        if(err) {
            console.error(err);
        } else {
            const blockHash = result.hash;
            console.log(blockHash);
            const timeStamp = getTimeStamp(new Date());
            getTransaction(blockHash, timeStamp);
        }
    })
    .on("connected", function(subscriptionId) {
        console.log(`Web Socket Connected! SubscriptionId: ${subscriptionId}`)
    })
}

async function getTransaction(blockHash, timeStamp) {
    const tx = await web3.eth.getBlock(blockHash, true, async (err, txsOfBlock) => {
        if(err) {
            return;
        } else {
            for(let i=0; i<txsOfBlock.transactions.length; i++) {
                //console.log(tx.transactions);
                const tx = txsOfBlock.transactions[i];
                const txId = txsOfBlock.transactions[i].hash;
                const txReceipt = await getTransactionReceipt(txId);
                if (tx.input == null || tx.input == undefined || tx.input == "0x") {
                    const fromAddr = tx.from;
                    const toAddr = tx.to;
                    //const gasPrice = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
                    //const coinValue = web3.utils.fromWei(tx.value.toString(), "ether");
                    let txEthInfo = new TxOfBlock();
                    txEthInfo.fromAddr = fromAddr;
                    txEthInfo.toAddr = toAddr;
                    //txEthInfo.gasPrice = web3.utils.fromWei(gasPrice.toString(), "ether");
                    //txEthInfo.coinVolume = coinValue;
                    txEthInfo.tokenContractAddr = "ETH";
                    txEthInfo.blockNumber = tx.blockNumber; 
                    txEthInfo.transactionHash = txId;
                    txEthInfo.timeStamp = timeStamp;
                    await printEthEvent(txEthInfo);
                    /*
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
                    */
                } else {
                    if(txReceipt.logs != null) {
                        const { logs } = txReceipt;
                        logs.map(async ({ topics, address, data, transactionHash }) => {
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
                                //const contract = new web3.eth.Contract(erc20Abi, address);
                                //const gasPrice = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
                                //const coinValue = web3.utils.fromWei(tx.value.toString(), "ether");
                                let txTokenInfo = new TxOfBlock();
                                txTokenInfo.fromAddr = fromAddr;
                                txTokenInfo.toAddr = toAddr;
                                //txTokenInfo.gasPrice = web3.utils.fromWei(gasPrice.toString(), "ether");
                                //txTokenInfo.coinVolume = coinValue;
                                txTokenInfo.tokenVolume = tokenValue;
                                txTokenInfo.tokenContractAddr = address;
                                txTokenInfo.blockNumber = txReceipt.blockNumber; 
                                txTokenInfo.transactionHash = transactionHash;
                                txTokenInfo.timeStamp = timeStamp;
                                await printTokenEvent(txTokenInfo);
                                const client = new kafka.KafkaClient({ kafkaHost: '59.10.9.149:9092' });
                                const producer = new kafka.Producer(client);
                                let payloads = [
                                    { topic: 'hello.kafka', messages: JSON.stringify(txTokenInfo), key: 'ETH'}
                                ]; 
                                producer.send(payloads, function(err, data) {
                                    if (err) {
                                        console.log('Error:', err);
                                    } else {
                                        console.log('Sent:', data);
                                        client.close();
                                    }
                                });
                            }
                        });
                    }
                }
            }
        }
    });
}

async function printEthEvent(TxOfBlock) {
    console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER START @@@@@@@@@@@@@@@@@");
    console.log(`Block Number: ${TxOfBlock.blockNumber}`);
    console.log(`Transaction Hash: ${TxOfBlock.transactionHash}`);
    console.log(`Transaction From Address: ${TxOfBlock.fromAddr}`);
    console.log(`Transaction To Address: ${TxOfBlock.toAddr}`);
    console.log(`Transaction Coin Name: ETH`);
    console.log(`Transaction Coin Value: ${TxOfBlock.coinValue} ETH`);
    //console.log(`Transaction Gas Fee: ${web3.utils.fromWei(TxOfBlock.gasPrice.toString(), "ether")} ETH`);
    console.log(`Block TimeStamp: ${TxOfBlock.timeStamp}`);
    console.log("@@@@@@@@@@@@@@@@@ TRANSACTION ETH TRANSFER FINISH @@@@@@@@@@@@@@@@@");
}

async function printTokenEvent(TxOfBlock) {
    console.log("################# TRANSACTION RECEIPT(TOKEN) START ####################");
    console.log(`Block Number: ${TxOfBlock.blockNumber}`);
    console.log(`Transaction Hash: ${TxOfBlock.transactionHash}`);
    console.log(`Transaction From Address: ${TxOfBlock.fromAddr}`);
    console.log(`Transaction To Address: ${TxOfBlock.toAddr}`);
    console.log(`Transaction SmartContract Address: ${TxOfBlock.tokenContractAddr}`);
    console.log(`Transaction Coin Value: ${TxOfBlock.coinValue} ETH`);
    console.log(`Transaction Token Value: ${TxOfBlock.tokenValue}`);
    //console.log(`Transaction Gas Fee: ${web3.utils.fromWei(TxOfBlock.gasPrice.toString(), "ether")} ETH`);
    console.log(`Block TimeStamp: ${TxOfBlock.timeStamp}`);
    console.log("################### TRANSACTION RECEIPT(TOKEN) FINISH #################");
}


async function getTransactionReceipt(txId) {
    const txReceipt = await web3.eth.getTransactionReceipt(txId);
    return txReceipt;
}

async function getTransactionInfo(tx) {
}

/*
async function getReciptData(txId, timeStamp) {
    const tx = await web3.eth.getTransaction(txId);
    const txReceipt = await web3.eth.getTransactionReceipt(txId);
    if (tx.input == null || tx.input == undefined || tx.input == "0x") {
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
        txEthInfo.timeStamp = timeStamp;
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
        console.log(`Block TimeStamp: ${timeStamp}`);
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
                    //const contract = new web3.eth.Contract(erc20Abi, address);
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
                    txInfo.timeStamp = timeStamp;
                }
            });
        }
    }
}
*/
Subscribe();

