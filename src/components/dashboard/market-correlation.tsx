import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const correlationData = [
  { asset: "S&P 500", correlation: 0.15, risk: "Low" },
  { asset: "Gold", correlation: -0.1, risk: "Low" },
  { asset: "NASDAQ 100", correlation: 0.25, risk: "Medium" },
  { asset: "DeFi Index", correlation: 0.85, risk: "High" },
  { asset: "NFT Index", correlation: 0.78, risk: "High" },
  { asset: "Real Estate", correlation: 0.05, risk: "Low" },
];

const getRiskBadgeClass = (risk: string) => {
  switch (risk) {
    case "High":
      return "bg-orange-500 hover:bg-orange-500/80";
    case "Medium":
      return "bg-yellow-500 hover:bg-yellow-500/80 text-black";
    case "Low":
    default:
      return "bg-green-500/20 hover:bg-green-500/30 text-green-700";
  }
};

export function MarketCorrelation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Asset Bubble Detection</CardTitle>
        <CardDescription>
          An illustrative example of correlation between the crypto market and other financial assets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Correlation</TableHead>
              <TableHead className="text-right">Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {correlationData.map((data) => (
              <TableRow key={data.asset}>
                <TableCell className="font-medium">{data.asset}</TableCell>
                <TableCell className="text-right">{data.correlation.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge className={getRiskBadgeClass(data.risk)}>{data.risk}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
