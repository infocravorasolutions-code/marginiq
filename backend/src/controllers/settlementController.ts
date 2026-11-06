import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { parse } from 'csv-parse';
import SettlementImport from '../models/SettlementImport';
import SettlementTransaction from '../models/SettlementTransaction';
import fs from 'fs';
import readline from 'readline';
import { SettlementParserFactory } from '../services/settlement/SettlementParserFactory';

export const importSettlementCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { marketplaceCode } = req.body;
    
    if (!marketplaceCode) {
      res.status(400).json({ success: false, message: 'Marketplace code is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'CSV file is required' });
      return;
    }

    // 1. Create Import Record
    const settlementImport = new SettlementImport({
      organizationId: req.user.organizationId,
      marketplaceCode,
      originalFileName: req.file.originalname,
      status: 'Processing'
    });

    await settlementImport.save();

    // Pre-process file to find header and strip preamble
    const fileStream = fs.createReadStream(req.file.path);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headerFound = false;
    let headers: string[] = [];
    const rawRows: Record<string, any>[] = [];

    for await (const line of rl) {
      if (!headerFound) {
        // Amazon's header usually starts with date/time
        if (line.toLowerCase().includes('date/time') && line.toLowerCase().includes('settlement id')) {
          headerFound = true;
          // Parse header line to array (simplified, assuming standard comma separated)
          headers = line.split(',').map(h => h.replace(/"/g, '').trim());
        }
        continue; // skip preamble
      }

      // Parse data rows
      if (line.trim().length > 0) {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i];
        });
        rawRows.push(row);
      }
    }

    if (!headerFound) {
      throw new Error('Could not find valid settlement headers in the file');
    }

    // 2. Resolve Parser
    const parser = SettlementParserFactory.getParserByHeaders(headers);
    if (!parser) {
      throw new Error('No compatible parser found for the uploaded file format');
    }

    // 3. Parse Transactions
    const normalizedTransactions = await parser.parse(rawRows);

    // 4. Validate Transactions
    const validationResult = parser.validate(normalizedTransactions);
    if (!validationResult.isValid) {
      // Log errors but continue saving valid ones, or fail entirely. We'll fail for now if there are severe mapping issues.
      throw new Error(`File mapping validation failed: ${validationResult.errors.slice(0, 5).join(', ')}`);
    }

    // 5. Save Transactions (Idempotent)
    let successCount = 0;
    
    for (const tx of normalizedTransactions) {
      try {
        const settlementTx = new SettlementTransaction({
          organizationId: req.user.organizationId,
          importId: settlementImport._id,
          marketplaceCode: parser.marketplaceCode,
          marketplaceOrderId: tx.marketplaceOrderId,
          transactionId: tx.transactionId,
          transactionType: tx.transactionType,
          transactionDate: tx.transactionDate,
          principalAmount: tx.principalAmount,
          totalMarketplaceFees: tx.totalMarketplaceFees,
          totalTaxes: tx.totalTaxes,
          totalShipping: tx.totalShipping,
          otherDeductions: tx.otherDeductions,
          netSettlementAmount: tx.netSettlementAmount,
          rawTransactionData: tx.rawTransactionData
        });
        await settlementTx.save();
        successCount++;
      } catch (err: any) {
        // E11000 duplicate key error means we already imported this exact transaction
        if (err.code !== 11000) {
          console.error('Error saving transaction:', err);
        }
      }
    }

    settlementImport.totalRows = normalizedTransactions.length;
    settlementImport.successfulRows = successCount;
    settlementImport.status = 'Completed';
    await settlementImport.save();

    // Clean up file
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: 'Settlement imported successfully',
      data: settlementImport
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getImports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const imports = await SettlementImport.find({ organizationId: req.user.organizationId })
      .sort({ importDate: -1 });
    res.json({ success: true, count: imports.length, data: imports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
