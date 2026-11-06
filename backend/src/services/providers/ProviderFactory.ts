import { MarketplaceProvider } from './MarketplaceProvider';
import { AmazonProvider } from './AmazonProvider';
import { FlipkartProvider } from './FlipkartProvider';
import { MeeshoProvider } from './MeeshoProvider';

export class ProviderFactory {
  static getMarketplaceProvider(marketplaceCode: string): MarketplaceProvider {
    switch (marketplaceCode.toLowerCase()) {
      case 'amazon':
        return new AmazonProvider();
      case 'flipkart':
        return new FlipkartProvider();
      case 'meesho':
        return new MeeshoProvider();
      default:
        throw new Error(`Unsupported marketplace provider: ${marketplaceCode}`);
    }
  }
}
