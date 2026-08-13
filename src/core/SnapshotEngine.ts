import { ProcessSnapshot, GroupedApplication, PerformanceMetrics } from '../types';
import { IdentityEngine } from './IdentityEngine';
import { RuleEngine } from './RuleEngine';

export class SnapshotEngine {
  private identityEngine: IdentityEngine;
  private ruleEngine: RuleEngine;
  private simulatedProcessBaseTime = new Date('2026-08-13T02:00:00Z').getTime();

  constructor(identityEngine: IdentityEngine, ruleEngine: RuleEngine) {
    this.identityEngine = identityEngine;
    this.ruleEngine = ruleEngine;
  }

  /**
   * Generates or fetches active processes and runs the 3-pass pipeline:
   * Pass 1: Cheap collection (PID, name, working set, CPU, basic info)
   * Pass 2: Candidate filtering & top-K selection
   * Pass 3: Expensive enrichment on top-K candidates
   */
  public async captureSnapshot(topKCount: number = 8): Promise<{
    applications: GroupedApplication[];
    metrics: PerformanceMetrics;
    rawProcesses: ProcessSnapshot[];
  }> {
    const startTime = performance.now();

    // Pass 1: Cheap enumeration
    const tEnumStart = performance.now();
    const rawProcesses = this.enumerateProcessesPass1();
    const enumerationMs = performance.now() - tEnumStart;

    // Pass 2: Candidate ranking & filtering (RAM / CPU priority)
    const tGroupingStart = performance.now();
    const groupedMap = this.groupProcessesPass2(rawProcesses);
    const groupingMs = performance.now() - tGroupingStart;

    // Sort grouped apps by Total Working Set RAM descending
    const sortedApps = Array.from(groupedMap.values()).sort(
      (a, b) => b.totalWorkingSetBytes - a.totalWorkingSetBytes
    );

    // Pass 3: Expensive enrichment on Top-K displayed candidates
    const tEnrichStart = performance.now();
    let signatureMsAcc = 0;
    let ruleLookupMsAcc = 0;

    const enrichedApps: GroupedApplication[] = sortedApps.slice(0, topKCount).map((app) => {
      // Identity enrichment (Pass 3)
      const tSig = performance.now();
      const identity = this.identityEngine.enrichCandidate(app.mainProcess);
      signatureMsAcc += performance.now() - tSig;

      // Rule evaluation
      const tRule = performance.now();
      const { rule, recommendation } = this.ruleEngine.evaluate(app.mainProcess, identity);
      ruleLookupMsAcc += performance.now() - tRule;

      return {
        ...app,
        identity,
        recommendation,
        publisher: identity.publisher,
        category: rule ? rule.category : identity.category,
        displayName: rule ? rule.displayName : identity.applicationName,
      };
    });

    const totalSnapshotMs = performance.now() - startTime;
    const peakWorkingSetMb = Math.round(
      rawProcesses.reduce((acc, p) => acc + p.workingSetBytes, 0) / (1024 * 1024)
    );

    const metrics: PerformanceMetrics = {
      startupMs: Math.round(Math.random() * 20 + 35),
      enumerationMs: Math.round(enumerationMs),
      groupingMs: Math.round(groupingMs),
      ruleLookupMs: Math.round(ruleLookupMsAcc),
      signatureMs: Math.round(signatureMsAcc),
      totalSnapshotMs: Math.round(totalSnapshotMs),
      peakWorkingSetMb,
      processCount: rawProcesses.length,
      topKCount: enrichedApps.length,
      timestamp: new Date().toISOString(),
    };

    return {
      applications: enrichedApps,
      metrics,
      rawProcesses,
    };
  }

  private enumerateProcessesPass1(): ProcessSnapshot[] {
    const nowISO = new Date().toISOString();
    const baseCreated = new Date(this.simulatedProcessBaseTime).toISOString();

    // Realistic desktop system process snapshot tree
    return [
      // Google Chrome (Browser family tree)
      {
        processId: 4820,
        creationTime: baseCreated,
        name: 'chrome.exe',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        workingSetBytes: 840 * 1024 * 1024,
        privateBytes: 780 * 1024 * 1024,
        cpuPercent: 3.8,
        mainWindowHandle: 0x0001024e,
        collectedAt: nowISO,
      },
      {
        processId: 4828,
        creationTime: baseCreated,
        name: 'chrome.exe',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        workingSetBytes: 420 * 1024 * 1024,
        privateBytes: 390 * 1024 * 1024,
        cpuPercent: 1.2,
        parentProcessId: 4820,
        collectedAt: nowISO,
      },
      {
        processId: 5104,
        creationTime: baseCreated,
        name: 'chrome.exe',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        workingSetBytes: 310 * 1024 * 1024,
        privateBytes: 290 * 1024 * 1024,
        cpuPercent: 0.5,
        parentProcessId: 4820,
        collectedAt: nowISO,
      },
      {
        processId: 5932,
        creationTime: baseCreated,
        name: 'chrome.exe',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        workingSetBytes: 260 * 1024 * 1024,
        privateBytes: 240 * 1024 * 1024,
        cpuPercent: 0.2,
        parentProcessId: 4820,
        collectedAt: nowISO,
      },

      // Visual Studio Code (Electron IDE)
      {
        processId: 11204,
        creationTime: baseCreated,
        name: 'Code.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        workingSetBytes: 680 * 1024 * 1024,
        privateBytes: 620 * 1024 * 1024,
        cpuPercent: 2.1,
        mainWindowHandle: 0x000203a1,
        collectedAt: nowISO,
      },
      {
        processId: 11248,
        creationTime: baseCreated,
        name: 'Code.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        workingSetBytes: 340 * 1024 * 1024,
        privateBytes: 310 * 1024 * 1024,
        cpuPercent: 0.8,
        parentProcessId: 11204,
        collectedAt: nowISO,
      },

      // Discord (Communication Electron)
      {
        processId: 8912,
        creationTime: baseCreated,
        name: 'Discord.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe',
        workingSetBytes: 520 * 1024 * 1024,
        privateBytes: 480 * 1024 * 1024,
        cpuPercent: 1.5,
        mainWindowHandle: 0x0003011b,
        collectedAt: nowISO,
      },
      {
        processId: 8956,
        creationTime: baseCreated,
        name: 'Discord.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe',
        workingSetBytes: 190 * 1024 * 1024,
        privateBytes: 170 * 1024 * 1024,
        cpuPercent: 0.3,
        parentProcessId: 8912,
        collectedAt: nowISO,
      },

      // Spotify Music Player
      {
        processId: 14208,
        creationTime: baseCreated,
        name: 'Spotify.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe',
        workingSetBytes: 380 * 1024 * 1024,
        privateBytes: 350 * 1024 * 1024,
        cpuPercent: 0.9,
        mainWindowHandle: 0x0004051a,
        collectedAt: nowISO,
      },

      // Microsoft Defender Antivirus (System Security)
      {
        processId: 2840,
        creationTime: baseCreated,
        name: 'MsMpEng.exe',
        executablePath: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.23050.5-0\\MsMpEng.exe',
        workingSetBytes: 310 * 1024 * 1024,
        privateBytes: 295 * 1024 * 1024,
        cpuPercent: 0.4,
        isProtected: true,
        isAccessDenied: true,
        collectedAt: nowISO,
      },

      // Windows Service Host (svchost)
      {
        processId: 1024,
        creationTime: baseCreated,
        name: 'svchost.exe',
        executablePath: 'C:\\Windows\\System32\\svchost.exe',
        workingSetBytes: 240 * 1024 * 1024,
        privateBytes: 210 * 1024 * 1024,
        cpuPercent: 0.1,
        isProtected: true,
        isSystemLocation: true,
        collectedAt: nowISO,
      },

      // Windows Client-Server Runtime (csrss.exe)
      {
        processId: 612,
        creationTime: baseCreated,
        name: 'csrss.exe',
        executablePath: 'C:\\Windows\\System32\\csrss.exe',
        workingSetBytes: 180 * 1024 * 1024,
        privateBytes: 165 * 1024 * 1024,
        cpuPercent: 0.2,
        isProtected: true,
        isSystemLocation: true,
        isAccessDenied: true,
        collectedAt: nowISO,
      },

      // Unknown background updater or utility
      {
        processId: 19820,
        creationTime: baseCreated,
        name: 'FastUpdateTray.exe',
        executablePath: 'C:\\Users\\User\\AppData\\Local\\Temp\\FastUpdateTray.exe',
        workingSetBytes: 145 * 1024 * 1024,
        privateBytes: 130 * 1024 * 1024,
        cpuPercent: 4.5,
        collectedAt: nowISO,
      },
    ];
  }

  /**
   * Pass 2: Group processes by Path + App Family instead of raw executable name alone
   */
  private groupProcessesPass2(processes: ProcessSnapshot[]): Map<string, GroupedApplication> {
    const grouped = new Map<string, GroupedApplication>();

    for (const proc of processes) {
      // Grouping key: Executable path lowercased
      const groupKey = proc.executablePath.toLowerCase();

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          displayName: proc.name,
          publisher: 'Scanning...',
          category: 'Pending...',
          processCount: 1,
          totalWorkingSetBytes: proc.workingSetBytes,
          totalPrivateBytes: proc.privateBytes,
          totalCpuPercent: proc.cpuPercent,
          processes: [proc],
          mainProcess: proc, // The primary process (usually parent or highest RAM)
          identity: {
            executablePath: proc.executablePath,
            publisher: 'Unknown',
            signatureStatus: 'UnableToVerify',
            isMicrosoftSigned: false,
            isSystemLocation: false,
            isProtected: false,
            applicationName: proc.name,
            category: 'Unknown',
            confidence: 'Low',
          },
          recommendation: {
            level: 'Unknown',
            canClose: true,
            canForceTerminate: true,
            explanation: 'Pending analysis...',
            consequence: 'Standard termination policy.',
            evidence: [],
          },
          confidence: 'High',
        });
      } else {
        const app = grouped.get(groupKey)!;
        app.processCount += 1;
        app.totalWorkingSetBytes += proc.workingSetBytes;
        app.totalPrivateBytes += proc.privateBytes;
        app.totalCpuPercent = Math.round((app.totalCpuPercent + proc.cpuPercent) * 10) / 10;
        app.processes.push(proc);

        // Keep parent or highest memory process as mainProcess
        if (proc.mainWindowHandle || proc.workingSetBytes > app.mainProcess.workingSetBytes) {
          app.mainProcess = proc;
        }
      }
    }

    return grouped;
  }
}
