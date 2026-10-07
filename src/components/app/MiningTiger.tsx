import tigerMiner from "@/assets/tiger-miner.png";

export function MiningTiger({ running }: { running: boolean }) {
  return (
    <div
      className={`mining-tiger mx-auto mb-3 ${running ? "is-running" : "is-resting"}`}
      role="img"
      aria-label={running ? "Tiger swinging a pickaxe at gold ore" : "Tiger resting beside gold ore"}
    >
      <img src={tigerMiner} alt="" className="mining-tiger-rock" />
      <img src={tigerMiner} alt="" className="mining-tiger-worker" />
      <span aria-hidden className="mining-tiger-spark text-primary">✦</span>
      <span aria-hidden className="mining-tiger-spark mining-tiger-spark-second text-primary">✦</span>
      <span aria-hidden className="mining-tiger-coin">🪙</span>
    </div>
  );
}