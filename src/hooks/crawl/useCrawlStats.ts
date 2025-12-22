import { useMemo } from "react";
import { CrawlJob } from "./useCrawlJobs";

export interface CrawlStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  errorJobs: number;
  idleJobs: number;
  averageSuccessRate: number;
  totalPagesFound: number;
  totalPdfsFound: number;
}

interface UseCrawlStatsResult {
  stats: CrawlStats;
}

export const useCrawlStats = (jobs: CrawlJob[]): UseCrawlStatsResult => {
  const stats = useMemo((): CrawlStats => {
    const totalJobs = jobs.length;
    const runningJobs = jobs.filter((job) => job.status === "running").length;
    const completedJobs = jobs.filter(
      (job) => job.status === "completed",
    ).length;
    const errorJobs = jobs.filter((job) => job.status === "error").length;
    const idleJobs = jobs.filter((job) => job.status === "idle").length;

    // Calculate average success rate
    const jobsWithSuccessRate = jobs.filter(
      (job) => job.successRate !== undefined,
    );
    const averageSuccessRate =
      jobsWithSuccessRate.length > 0
        ? Math.round(
            jobsWithSuccessRate.reduce(
              (sum, job) => sum + (job.successRate || 0),
              0,
            ) / jobsWithSuccessRate.length,
          )
        : 0;

    // Calculate totals
    const totalPagesFound = jobs.reduce((sum, job) => sum + job.pagesFound, 0);
    const totalPdfsFound = jobs.reduce((sum, job) => sum + job.pdfsFound, 0);

    return {
      totalJobs,
      runningJobs,
      completedJobs,
      errorJobs,
      idleJobs,
      averageSuccessRate,
      totalPagesFound,
      totalPdfsFound,
    };
  }, [jobs]);

  return { stats };
};
