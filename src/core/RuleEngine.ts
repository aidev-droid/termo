import { ProcessSnapshot, ProcessIdentity, Rule, RulesConfig, Recommendation, RecommendationLevel } from '../types';

export class RuleEngine {
  private rulesConfig: RulesConfig;

  constructor(rulesConfig: RulesConfig) {
    this.rulesConfig = rulesConfig;
  }

  public updateConfig(newConfig: RulesConfig): void {
    this.rulesConfig = newConfig;
  }

  public getConfig(): RulesConfig {
    return this.rulesConfig;
  }

  /**
   * Evaluates process identity & snapshot against rules using strict priority precedence:
   * 1. Exact signed identity
   * 2. Publisher + file name
   * 3. Known path + file name
   * 4. Known executable name
   * 5. Generic category
   * 6. Unknown
   */
  public evaluate(process: ProcessSnapshot, identity: ProcessIdentity): { rule: Rule | null; recommendation: Recommendation } {
    const evidence: string[] = [];
    let matchedRule: Rule | null = null;

    // Collect base evidence signals
    if (identity.isMicrosoftSigned) {
      evidence.push('Digitally signed by Microsoft Corporation');
    } else if (identity.signatureStatus === 'Valid') {
      evidence.push(`Valid digital signature from publisher: "${identity.publisher}"`);
    } else if (identity.signatureStatus === 'Unsigned') {
      evidence.push('Executable is NOT digitally signed');
    } else if (identity.signatureStatus === 'UnableToVerify') {
      evidence.push('Signature status could not be verified');
    }

    if (identity.isSystemLocation) {
      evidence.push('Executable path is located inside protected system directory (C:\\Windows\\System32)');
    }

    if (process.isProtected) {
      evidence.push('Process is running inside a protected Windows security access boundary');
    }

    if (process.isAccessDenied) {
      evidence.push('Access Denied: Standard process handles are restricted by OS security policy');
    }

    // Try rules matching in deterministic priority order
    const sortedRules = [...this.rulesConfig.identities].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.doesRuleMatch(rule, process, identity)) {
        matchedRule = rule;
        evidence.push(`Matched Rule: [${rule.matchType}] "${rule.displayName}" (${rule.category})`);
        break;
      }
    }

    // Calculate Recommendation based on rule or baseline fallback
    const recommendation = this.buildRecommendation(process, identity, matchedRule, evidence);

    return { rule: matchedRule, recommendation };
  }

  private doesRuleMatch(rule: Rule, process: ProcessSnapshot, identity: ProcessIdentity): boolean {
    const exeNameLower = process.name.toLowerCase();
    const ruleFileNameLower = rule.fileName.toLowerCase();

    switch (rule.matchType) {
      case 'ExactSigned':
        return (
          exeNameLower === ruleFileNameLower &&
          identity.signatureStatus === 'Valid' &&
          (rule.publisher ? identity.publisher.toLowerCase().includes(rule.publisher.toLowerCase()) : true)
        );

      case 'PublisherAndFileName':
        return (
          exeNameLower === ruleFileNameLower &&
          identity.publisher.toLowerCase().includes(rule.publisher.toLowerCase())
        );

      case 'KnownPathAndFileName':
        return (
          exeNameLower === ruleFileNameLower &&
          (rule.path ? process.executablePath.toLowerCase() === rule.path.toLowerCase() : identity.isSystemLocation)
        );

      case 'KnownExecutableName':
        return exeNameLower === ruleFileNameLower;

      case 'GenericCategory':
        return identity.category.toLowerCase() === rule.category.toLowerCase();

      default:
        return false;
    }
  }

  private buildRecommendation(
    process: ProcessSnapshot,
    identity: ProcessIdentity,
    matchedRule: Rule | null,
    evidence: string[]
  ): Recommendation {
    // 1. Critical OS System Processes or AccessDenied
    if (process.isProtected || identity.isSystemLocation || (matchedRule && matchedRule.closePolicy === 'ProtectedSystem')) {
      return {
        level: 'Red',
        canClose: false,
        canForceTerminate: false,
        explanation: matchedRule
          ? `Protected System Service: ${matchedRule.displayName}. ${matchedRule.impact}`
          : 'Protected Windows core component or system security boundary.',
        consequence: matchedRule ? matchedRule.impact : 'Attempting to terminate this process may cause system instability or immediate reboot.',
        evidence,
      };
    }

    // 2. Caution / Background Utilities
    if (matchedRule && matchedRule.closePolicy === 'CautionRequired') {
      return {
        level: 'Yellow',
        canClose: true,
        canForceTerminate: true,
        explanation: `Caution Advised: ${matchedRule.displayName}. ${matchedRule.impact}`,
        consequence: matchedRule.impact,
        evidence,
      };
    }

    // 3. User Applications (Green)
    if (matchedRule && matchedRule.closePolicy === 'UserApplication') {
      return {
        level: 'Green',
        canClose: true,
        canForceTerminate: true,
        explanation: `Safe User Application: ${matchedRule.displayName}. Can be closed safely.`,
        consequence: matchedRule.impact || 'Application session will terminate.',
        evidence,
      };
    }

    // 4. Known signed third party apps without explicit rules
    if (identity.signatureStatus === 'Valid' && !identity.isSystemLocation) {
      return {
        level: 'Green',
        canClose: true,
        canForceTerminate: true,
        explanation: `Verified Application (${identity.publisher}). Safe to close if not actively needed.`,
        consequence: 'The application process will exit.',
        evidence,
      };
    }

    // 5. Unsigned / Unknown apps
    return {
      level: 'Unknown',
      canClose: true,
      canForceTerminate: true,
      explanation: 'Unknown executable identity. Exercise caution before terminating unknown background processes.',
      consequence: 'Process will be terminated. Verify if this executable belongs to an active background service.',
      evidence,
    };
  }
}
