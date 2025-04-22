import {ethers} from "ethers";
import {MarketParams} from "@kuru-labs/kuru-sdk/src/types";
import {OrderBook} from "@kuru-labs/kuru-sdk/src/market/orderBook";


export class Estimator {
    static async estimateRequiredQuoteForBuy(
        providerOrSigner: ethers.providers.JsonRpcProvider | ethers.Signer,
        orderbookAddress: string,
        marketParams: MarketParams,
        baseTokenAmount: number,
        l2Book: unknown,
        contractVaultParams: unknown
    ): Promise<number> {
        let out = `\n`;
        const takerFeeBps = marketParams.takerFeeBps.toNumber() / 10000;
        out += `takerFeeBps: ${takerFeeBps}\n`
        const grossBaseTokenAmount = baseTokenAmount / (1 - takerFeeBps);
        out += `grossBaseTokenAmount: ${grossBaseTokenAmount}\n`
        const l2OrderBook = await OrderBook.getL2OrderBook(
            providerOrSigner,
            orderbookAddress,
            marketParams,
            l2Book,
            contractVaultParams
        );

        let remainingBase = grossBaseTokenAmount;
        let requiredQuoteTokens = 0;

        out += `l2OrderBook.asks: ${l2OrderBook.asks.length}\n`
        for (const [price, orderSize] of l2OrderBook.asks.reverse()) {
            const orderSizeFloat = orderSize!;
            const priceFloat = price!;

            if (remainingBase <= 0) {
                break;
            }

            if (remainingBase >= orderSizeFloat) {
                requiredQuoteTokens += orderSizeFloat * priceFloat;
                remainingBase -= orderSizeFloat;
            } else {
                requiredQuoteTokens += remainingBase * priceFloat;
                remainingBase = 0;
            }
        }

        console.log(out)

        return requiredQuoteTokens;
    }
}