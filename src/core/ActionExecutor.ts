import { ProcessSnapshot, ActionTarget, ActionResult } from '../types';

export class ActionExecutor {
  /**
   * Executes a process termination or close request with strict PID-reuse defense
   * TRD §22: Never rely on PID alone.
   * At action execution time, re-read target:
   * PID matches? AND creation time matches? AND executable path matches?
   */
  public executeAction(
    target: ActionTarget,
    activeProcesses: ProcessSnapshot[],
    simulatePidReuse: boolean = false
  ): ActionResult {
    const currentTargetProc = activeProcesses.find((p) => p.processId === target.processId);

    // 1. Process disappeared before action
    if (!currentTargetProc) {
      return {
        success: false,
        targetPid: target.processId,
        action: target.forceTerminate ? 'ForceTerminate' : 'GracefulClose',
        message: 'Process already exited before action could be completed.',
        revalidationPassed: false,
        code: 'PROCESS_NOT_FOUND',
        details: `Process PID ${target.processId} was not found in the current OS process tree snapshot.`,
      };
    }

    // 2. PID Reuse Simulation / Revalidation check
    if (simulatePidReuse) {
      return {
        success: false,
        targetPid: target.processId,
        action: target.forceTerminate ? 'ForceTerminate' : 'GracefulClose',
        message: 'ACTION ABORTED: PID reuse attack/recycle detected!',
        revalidationPassed: false,
        isPidReused: true,
        code: 'PID_REUSED',
        details: `Security Revalidation Failed! Target PID ${target.processId} creation timestamp [${target.creationTime}] does not match current process timestamp [${new Date().toISOString()}]. PID was recycled by another process. Action safely blocked.`,
      };
    }

    // Actual revalidation check
    const creationTimeMatch = currentTargetProc.creationTime === target.creationTime;
    const pathMatch = currentTargetProc.executablePath.toLowerCase() === target.executablePath.toLowerCase();

    if (!creationTimeMatch || !pathMatch) {
      return {
        success: false,
        targetPid: target.processId,
        action: target.forceTerminate ? 'ForceTerminate' : 'GracefulClose',
        message: 'SAFETY BLOCK: Process identity mismatch or PID reused!',
        revalidationPassed: false,
        isPidReused: true,
        code: 'PID_REUSED',
        details: `PID ${target.processId} identity revalidation failed. Path or creation time changed. Original: ${target.executablePath}, Current: ${currentTargetProc.executablePath}.`,
      };
    }

    // 3. Protected process check
    if (currentTargetProc.isProtected || currentTargetProc.isAccessDenied) {
      return {
        success: false,
        targetPid: target.processId,
        action: target.forceTerminate ? 'ForceTerminate' : 'GracefulClose',
        message: 'ACCESS DENIED: Cannot terminate protected system process.',
        revalidationPassed: true,
        code: 'PROTECTED_PROCESS',
        details: `Process PID ${target.processId} (${currentTargetProc.name}) runs in a protected Windows security access boundary. Access Denied (0x80070005).`,
      };
    }

    // 4. Successful execution simulation
    const actionType = target.forceTerminate ? 'ForceTerminate' : 'GracefulClose';
    return {
      success: true,
      targetPid: target.processId,
      action: actionType,
      message: `${actionType === 'ForceTerminate' ? 'Force Terminated' : 'Gracefully Closed'} process "${currentTargetProc.name}" (PID ${target.processId}).`,
      revalidationPassed: true,
      code: 'SUCCESS',
      details: `Target revalidation passed (PID: ${target.processId}, Created: ${target.creationTime}, Path: ${target.executablePath}). ${actionType === 'ForceTerminate' ? 'SIGKILL / TerminateProcess issued.' : 'WM_CLOSE message sent to window handle.'}`,
    };
  }
}
