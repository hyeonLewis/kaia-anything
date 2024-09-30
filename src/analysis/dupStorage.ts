import fs from "fs";

const path = "src/data/storageKeys/";

function main() {
    const storageKeys = JSON.parse(fs.readFileSync(path + "storageKeys.json", "utf8"));
    const data: Map<string, { txHash: string; from: string; to: string; selector: string; keys: string[] }[]> =
        new Map();

    const blockNumbers = new Set<string>();
    for (const blockNumber in storageKeys) {
        blockNumbers.add(blockNumber);
        for (const txHash in storageKeys[blockNumber]) {
            const { from, to, selector, keys } = storageKeys[blockNumber][txHash];
            data.set(blockNumber, [...(data.get(blockNumber) || []), { txHash, from, to, selector, keys }]);
        }
    }

    const duplicatedTxHashes: { blockNumber: string; txHash: string }[] = [];
    for (const blockNumber of blockNumbers) {
        const txs = data.get(blockNumber);
        if (!txs || txs.length <= 1) {
            continue;
        }

        const keyMap = new Map<string, string[]>();
        for (const tx of txs) {
            for (const key of tx.keys) {
                if (!keyMap.has(key)) {
                    keyMap.set(key, []);
                }
                keyMap.get(key)!.push(tx.txHash);
            }
        }

        for (const [_, txHashes] of keyMap) {
            if (txHashes.length > 1) {
                for (const txHash of txHashes) {
                    duplicatedTxHashes.push({ blockNumber, txHash });
                }
                break;
            }
        }
    }

    fs.writeFileSync(path + "duplicatedTxHashes.json", JSON.stringify(duplicatedTxHashes, null, 2));
}

main();
