import { exportBackupBundle } from "../functions/_lib/backup/exportBackupBundle";
import { AppError } from "../functions/_lib/types/env";
import type { Env } from "../functions/_lib/types/env";

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.BACKUPS || !env.BACKUP_ENCRYPTION_KEY) {
      return;
    }

    const job = (async () => {
      const dropThreshold = Number(env.BACKUP_DROP_THRESHOLD_PERCENT || 20);
      const isHourlySnapshot = new Date(controller.scheduledTime).getUTCMinutes() === 0;
      const since = isHourlySnapshot ? undefined : new Date(controller.scheduledTime - 10 * 60 * 1000).toISOString();

      try {
        await exportBackupBundle(env.DB, env.BACKUPS!, env.BACKUP_ENCRYPTION_KEY!, {
          since,
          dropThresholdPercent: Number.isFinite(dropThreshold) ? dropThreshold : 20,
        });
      } catch (err) {
        if (err instanceof AppError && err.code === "backup_guard_empty_db") {
          return;
        }
        throw err;
      }
    })();

    ctx.waitUntil(job);
  },
};
