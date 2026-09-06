import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const total = await prisma.media.count();
    const byCategory = await prisma.media.groupBy({
      by: ['category'],
      _count: true,
    });
    const byStatus = await prisma.media.groupBy({
      by: ['status'],
      _count: true,
    });
    const avgRating = await prisma.media.aggregate({
      _avg: { rating: true },
      where: { rating: { gt: 0 } },
    });

    // Weekly stats - episodes watched this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyEpisodes = await prisma.activity.aggregate({
      _sum: { episode: true },
      _count: true,
      where: {
        timestamp: { gte: weekStart },
        action: 'episode_watched',
      },
    });

    // Completions this week
    const weeklyCompleted = await prisma.activity.count({
      where: {
        timestamp: { gte: weekStart },
        action: 'completed',
      },
    });

    // Activity heatmap - last 90 days
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const recentActivities = await prisma.activity.findMany({
      where: { timestamp: { gte: ninetyDaysAgo } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Group by date
    const heatmap: Record<string, number> = {};
    recentActivities.forEach((a) => {
      const date = a.timestamp.toISOString().split('T')[0];
      heatmap[date] = (heatmap[date] || 0) + 1;
    });

    // All-time completions
    const totalCompleted = await prisma.activity.count({
      where: { action: 'completed' },
    });

    // Longest streak
    const allDates = [...new Set(
      recentActivities.map((a) => a.timestamp.toISOString().split('T')[0])
    )].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const today = now.toISOString().split('T')[0];

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          streak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
    }

    // Check if today or yesterday is in the set for current streak
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (allDates.includes(today) || allDates.includes(yesterdayStr)) {
      currentStreak = streak;
    } else {
      currentStreak = 0;
    }

    return NextResponse.json({
      total,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      averageRating: avgRating._avg.rating || 0,
      weekly: {
        episodes: weeklyEpisodes._sum.episode || 0,
        activities: weeklyEpisodes._count || 0,
        completed: weeklyCompleted,
      },
      heatmap,
      totalCompleted,
      currentStreak,
      longestStreak,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    );
  }
}
