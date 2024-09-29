# kaia-anything

## Setup

```bash
npm install

cp .env.example .env
```

## Run

```bash
export HARDHAT_NETWORK=...
hh run collector/gasPriceData.ts
hh run collector/touchStorage.ts
```

## Notes

- `hh run collector/gasPriceData.ts` will run the script and output the results to `data/gasPriceData.json`
- `hh run collector/touchStorage.ts` will run the script and output the results to `data/touchedStorage.json`
