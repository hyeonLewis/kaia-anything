import { ethers } from "hardhat";
import fs from "fs";

const NUM_BLOCKS = 10000;

async function main() {
    const provider = ethers.provider;
    const startBlock = 164130000; // await provider.getBlockNumber();
    console.log(startBlock);

    const start = startBlock - NUM_BLOCKS;

    const processBlock = async (i: number) => {
        const block = await provider.getBlockWithTransactions(i);
        const result: any = { blockNumber: i };

        if (block.baseFeePerGas) {
            result.baseFee = Number(block.baseFeePerGas);
        }

        result.effectiveGasPriceForType0 = [];
        result.effectiveGasPriceForType2 = [];
        result.maxPriorityFeePerGas = [];
        result.maxFeePerGas = [];

        const receipts = await Promise.all(block.transactions.map((tx) => provider.getTransactionReceipt(tx.hash)));

        for (let j = 0; j < block.transactions.length; j++) {
            const tx = block.transactions[j];
            const receipt = receipts[j];

            if (tx.type === 0) {
                result.effectiveGasPriceForType0.push(Number(receipt.effectiveGasPrice));
            } else if (tx.type === 2) {
                result.effectiveGasPriceForType2.push(Number(receipt.effectiveGasPrice));
                result.maxPriorityFeePerGas.push(Number(tx.maxPriorityFeePerGas));
                result.maxFeePerGas.push(Number(tx.maxFeePerGas));
            }
        }

        console.log(`Processed block ${i - start} / ${NUM_BLOCKS}`);
        return result;
    };

    const BATCH_SIZE = 10; // Adjust this value based on your network and system capabilities
    const results = [];

    for (let i = start; i < startBlock; i += BATCH_SIZE) {
        const batch = Array.from({ length: Math.min(BATCH_SIZE, startBlock - i) }, (_, index) => i + index);
        const batchResults = await Promise.all(batch.map(processBlock));
        results.push(...batchResults);
    }

    // Process results
    const baseFee: { [key: number]: number } = {};
    const effectiveGasPriceForType0: { [key: number]: number[] } = {};
    const effectiveGasPriceForType2: { [key: number]: number[] } = {};
    const maxPriorityFeePerGas: { [key: number]: number[] } = {};
    const maxFeePerGas: { [key: number]: number[] } = {};

    for (const result of results) {
        const { blockNumber, ...data } = result;
        if (data.baseFee) baseFee[blockNumber] = data.baseFee;
        effectiveGasPriceForType0[blockNumber] = data.effectiveGasPriceForType0;
        effectiveGasPriceForType2[blockNumber] = data.effectiveGasPriceForType2;
        maxPriorityFeePerGas[blockNumber] = data.maxPriorityFeePerGas;
        maxFeePerGas[blockNumber] = data.maxFeePerGas;
    }

    const path = "src/data/gasPrice";

    fs.writeFileSync(`${path}/baseFee.json`, JSON.stringify(baseFee, null, 2));
    fs.writeFileSync(`${path}/effectiveGasPriceForType0.json`, JSON.stringify(effectiveGasPriceForType0, null, 2));
    fs.writeFileSync(`${path}/effectiveGasPriceForType2.json`, JSON.stringify(effectiveGasPriceForType2, null, 2));
    fs.writeFileSync(`${path}/maxPriorityFeePerGas.json`, JSON.stringify(maxPriorityFeePerGas, null, 2));
    fs.writeFileSync(`${path}/maxFeePerGas.json`, JSON.stringify(maxFeePerGas, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
