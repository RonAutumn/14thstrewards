import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  user_id: string;
  description: string;
  points: number;
  type: "EARN" | "REDEEM";
  created_at: string;
  reward_code?: string;
  reward_id?: string;
  status?: "completed" | "points_update_failed";
}

interface PointsHistoryProps {
  transactions: Transaction[];
}

export default function PointsHistory({ transactions }: PointsHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the current time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getDateFromTransaction = (created_at: string): Date => {
    return new Date(created_at);
  };

  const formatPoints = (points: number | undefined): string => {
    if (typeof points !== "number") return "0 points";
    const absPoints = Math.abs(Math.round(points));
    return `${absPoints} points`;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      getDateFromTransaction(b.created_at).getTime() -
      getDateFromTransaction(a.created_at).getTime()
  );
  const displayTransactions = showAll
    ? sortedTransactions
    : sortedTransactions.slice(0, 5);

  if (transactions.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Points History</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show Less" : "View All"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between items-center py-2 border-b border-border last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(
                    getDateFromTransaction(transaction.created_at),
                    currentTime,
                    { addSuffix: true }
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "font-semibold text-sm",
                  transaction.type === "EARN"
                    ? "text-green-500"
                    : "text-red-500"
                )}
              >
                {transaction.type === "EARN" ? "+" : "-"}
                {formatPoints(transaction.points)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
