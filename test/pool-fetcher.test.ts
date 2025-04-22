import {describe, it} from "@jest/globals";
import {PoolFetcher} from "@kuru-labs/kuru-sdk";


describe("Pool Fetcher", () => {
    it("Get Pools", async () => {
        const kuruApi = "https://api.testnet.kuru.io";
        const poolFetcher = new PoolFetcher(kuruApi);

        try {
            // Get all pools with custom base tokens
            const pools = await poolFetcher.getAllPools();

            console.log("Found pools:");
            pools.forEach((pool, index) => {
                console.log(
                  `\nPool ${index + 1}:
Base Token: ${pool.baseToken}
Quote Token: ${pool.quoteToken}
Orderbook: ${pool.orderbook}`
                );
            });
        } catch (error) {
            console.error("Error finding pools:", error);
        }
    }, 10000000);
})