import { GRAY_50, GRAY_200 } from "../../theme/colors";
import Skeleton from "./Skeleton";

export default function SkeletonCourseCard() {
  return (
    <div style={{
      background: GRAY_50,
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
      borderLeft: `4px solid ${GRAY_200}`,
    }}>
      {/* Icon + title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Skeleton width={40} height={40} borderRadius={8} style={{ flexShrink: 0 }} />
        <Skeleton width="60%" height={18} borderRadius={6} />
      </div>
      {/* Avatar/count row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Skeleton width={28} height={28} borderRadius="50%" style={{ flexShrink: 0 }} />
        <Skeleton width={100} height={14} borderRadius={6} />
      </div>
      {/* Button */}
      <Skeleton width={120} height={38} borderRadius={8} />
    </div>
  );
}
