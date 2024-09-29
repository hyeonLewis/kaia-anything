import { ethers } from "hardhat";
import * as hardhat from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";

const hre = hardhat as HardhatRuntimeEnvironment;

async function getStorageKeys(txHash: string) {
    const traces = await hre.network.provider.send("debug_traceTransaction", [txHash, { loggerTimeout: "60s" }]);
    const storageKeys: string[] = [];
    const traceSteps = traces.structLogs as { op: string; stack: string[] }[];
    for (const trace of traceSteps) {
        if (trace.op === "SLOAD" || trace.op === "SSTORE") {
            if (trace.stack.length > 0 && !storageKeys.includes(trace.stack[trace.stack.length - 1])) {
                storageKeys.push(trace.stack[trace.stack.length - 1]);
            }
        }
    }
    return storageKeys;
}

async function main() {
    const currentBlock = await ethers.provider.getBlockNumber();
    const numBlocks = 1;
    const lastAllowedBlock = 100;
    const startBlock = currentBlock - lastAllowedBlock;

    // Sampling blocks
    const blocks = [];
    while (blocks.length < numBlocks) {
        const block = await ethers.provider.getBlock(startBlock + Math.floor(Math.random() * lastAllowedBlock));
        if (block.transactions.length > 0) {
            blocks.push(block);
        }
    }

    const storageKeys: {
        [blockNumber: number]: { [txHash: string]: { from: string; to: string; keys: string[] } };
    } = {};
    for (const block of blocks) {
        console.log(`Processing block ${block.number}, ${block.transactions.length} transactions`);
        const txPromises = block.transactions.map(async (tx) => {
            const transaction = await ethers.provider.getTransaction(tx);
            const receipt = await ethers.provider.getTransactionReceipt(tx);
            if (receipt.to && transaction.data !== "0x") {
                const keys = await getStorageKeys(tx);
                return {
                    tx,
                    from: receipt.from,
                    to: receipt.to,
                    selector: transaction.data.slice(0, 10),
                    keys: Array.from(keys),
                };
            }
            return null;
        });

        const results = await Promise.all(txPromises);

        storageKeys[block.number] = results.reduce(
            (acc: { [txHash: string]: { from: string; to: string; selector: string; keys: string[] } }, result) => {
                if (result) {
                    acc[result.tx] = {
                        from: result.from,
                        to: result.to,
                        selector: result.selector,
                        keys: result.keys,
                    };
                }
                return acc;
            },
            {}
        );
    }
    const path = "src/data/storageKeys/storageKeys.json";

    fs.writeFileSync(path, JSON.stringify(storageKeys, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
