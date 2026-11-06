import { SettlementParser } from './SettlementParser';
import { AmazonSettlementParser } from './parsers/AmazonSettlementParser';
// import { FlipkartSettlementParser } from './parsers/FlipkartSettlementParser';
// import { MeeshoSettlementParser } from './parsers/MeeshoSettlementParser';

export class SettlementParserFactory {
  private static parsers: SettlementParser[] = [
    new AmazonSettlementParser(),
    // new FlipkartSettlementParser(),
    // new MeeshoSettlementParser()
  ];

  static getParserByMarketplace(marketplaceCode: string): SettlementParser {
    const parser = this.parsers.find(p => p.marketplaceCode === marketplaceCode);
    if (!parser) {
      throw new Error(`No settlement parser found for marketplace: ${marketplaceCode}`);
    }
    return parser;
  }

  static getParserByHeaders(headers: string[]): SettlementParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(headers)) {
        return parser;
      }
    }
    return null;
  }
}
