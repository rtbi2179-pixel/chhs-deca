import { BarChart3, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MarketAnalytics() {
  return (
    <main className="page-shell">
      <div className="page-content max-w-3xl">
        <header>
          <p className="page-eyebrow">Portfolio integrity</p>
          <h1 className="page-title mt-2">Portfolio analytics moved to BBX</h1>
          <p className="page-intro mt-3">The retired stock portfolio does not have server-recorded market marks, so Blue Blazer no longer presents its cost basis as investment performance.</p>
        </header>
        <Card className="editorial-panel mt-8 p-6">
          <div className="flex gap-4">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
            <div>
              <h2 className="section-heading">Authoritative fictional performance</h2>
              <p className="mt-3 leading-7 text-foreground/65">Use the BBX portfolio for live fictional marks, recorded fills, position-level unrealized return, and return rankings calculated by the server.</p>
              <Link href="/market/portfolio"><Button className="mt-5"><BarChart3 className="mr-2 h-4 w-4" />Open BBX portfolio</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
