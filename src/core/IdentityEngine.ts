import { ProcessSnapshot, ProcessIdentity, SignatureStatus } from '../types';

export class IdentityEngine {
  // In-memory caching Dictionary<FileIdentity, Metadata> as per TRD §16
  private cache = new Map<string, ProcessIdentity>();

  public getCacheSize(): number {
    return this.cache.size;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public enrichCandidate(process: ProcessSnapshot): ProcessIdentity {
    const cacheKey = process.executablePath.toLowerCase();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const identity = this.inspectExecutable(process);
    this.cache.set(cacheKey, identity);
    return identity;
  }

  private inspectExecutable(process: ProcessSnapshot): ProcessIdentity {
    const pathLower = process.executablePath.toLowerCase();
    const nameLower = process.name.toLowerCase();

    let publisher = 'Unknown Publisher';
    let signatureStatus: SignatureStatus = 'Unsigned';
    let isMicrosoftSigned = false;
    let isSystemLocation = false;
    let isProtected = false;
    let category = 'Unknown Application';
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    let appName = process.name.replace(/\.exe$/i, '');

    // Check system location
    if (pathLower.includes('\\windows\\system32') || pathLower.includes('\\windows\\syswow64')) {
      isSystemLocation = true;
      publisher = 'Microsoft Windows Publisher';
      signatureStatus = 'Valid';
      isMicrosoftSigned = true;
      isProtected = true;
      category = 'Windows Core System';
      confidence = 'High';
    } else if (pathLower.includes('microsoft defender') || nameLower === 'msmpeng.exe') {
      publisher = 'Microsoft Windows Publisher';
      signatureStatus = 'Valid';
      isMicrosoftSigned = true;
      isProtected = true;
      category = 'System Security';
      confidence = 'High';
    } else if (nameLower === 'chrome.exe') {
      publisher = 'Google LLC';
      signatureStatus = 'Valid';
      isMicrosoftSigned = false;
      category = 'Browser';
      appName = 'Google Chrome';
      confidence = 'High';
    } else if (nameLower === 'msedge.exe') {
      publisher = 'Microsoft Corporation';
      signatureStatus = 'Valid';
      isMicrosoftSigned = true;
      category = 'Browser';
      appName = 'Microsoft Edge';
      confidence = 'High';
    } else if (nameLower === 'code.exe') {
      publisher = 'Microsoft Corporation';
      signatureStatus = 'Valid';
      isMicrosoftSigned = true;
      category = 'Developer Tool';
      appName = 'Visual Studio Code';
      confidence = 'High';
    } else if (nameLower === 'discord.exe') {
      publisher = 'Discord Inc.';
      signatureStatus = 'Valid';
      isMicrosoftSigned = false;
      category = 'Communication';
      appName = 'Discord';
      confidence = 'High';
    } else if (nameLower === 'spotify.exe') {
      publisher = 'Spotify Ltd';
      signatureStatus = 'Valid';
      isMicrosoftSigned = false;
      category = 'Media Player';
      appName = 'Spotify Music';
      confidence = 'High';
    } else if (nameLower === 'steam.exe') {
      publisher = 'Valve Corp.';
      signatureStatus = 'Valid';
      isMicrosoftSigned = false;
      category = 'Game Launcher';
      appName = 'Steam Client';
      confidence = 'High';
    } else if (pathLower.includes('program files')) {
      signatureStatus = 'Valid';
      publisher = 'Verified Software Publisher';
      confidence = 'Medium';
      category = 'Software Application';
    } else {
      signatureStatus = 'Unsigned';
      confidence = 'Low';
    }

    if (process.isProtected) {
      isProtected = true;
    }

    return {
      executablePath: process.executablePath,
      publisher,
      signatureStatus,
      isMicrosoftSigned,
      isSystemLocation,
      isProtected,
      applicationName: appName,
      category,
      confidence,
    };
  }
}
