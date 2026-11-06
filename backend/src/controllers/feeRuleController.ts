import { Response, Request } from 'express';
import MarketplaceFeeRule from '../models/MarketplaceFeeRule';
import { AuthRequest } from '../middlewares/auth';
import { RuleResolverService, ResolveRuleInput } from '../services/RuleResolverService';

export const getFeeRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rules = await MarketplaceFeeRule.find().sort({ marketplaceCode: 1, feeType: 1, effectiveFrom: -1 });
    res.json({ success: true, count: rules.length, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFeeRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newRule = new MarketplaceFeeRule(req.body);
    const savedRule = await newRule.save();
    res.status(201).json({ success: true, data: savedRule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFeeRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oldRule = await MarketplaceFeeRule.findById(req.params.id);
    if (!oldRule) {
      res.status(404).json({ success: false, message: 'Fee rule not found' });
      return;
    }

    // Never silently overwrite an active rule's values. Versioning is required.
    // Set old rule's effectiveUntil to just before the new rule takes effect.
    const newEffectiveFrom = new Date(req.body.effectiveFrom || Date.now());
    oldRule.effectiveUntil = new Date(newEffectiveFrom.getTime() - 1);
    await oldRule.save();

    // Create a new version of the rule
    const newRuleData = { ...oldRule.toObject(), ...req.body };
    delete newRuleData._id;
    delete newRuleData.createdAt;
    delete newRuleData.updatedAt;
    
    newRuleData.version = oldRule.version + 1;
    newRuleData.effectiveFrom = newEffectiveFrom;
    
    const newRule = new MarketplaceFeeRule(newRuleData);
    const savedNewRule = await newRule.save();

    res.json({ success: true, data: savedNewRule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const validateFeeRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: ResolveRuleInput = req.body;
    
    // Test the resolver to see what rule hits and if there's a conflict
    const result = await RuleResolverService.resolve(input);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    // If conflict detected, it will throw an error string here
    res.status(400).json({ success: false, message: error.message });
  }
};
