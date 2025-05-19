-- CreateTable
CREATE TABLE "SyntheticChatLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "chatlog" TEXT NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "customerSatisfaction" INTEGER,
    "performanceTrajectory" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "SyntheticChatLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SyntheticChatLog" ADD CONSTRAINT "SyntheticChatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
