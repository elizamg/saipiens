import { GRAY_200 } from "../../theme/colors";
import Skeleton from "./Skeleton";

export default function SkeletonBanner() {
  return (
    <div style={{
      background: GRAY_200,
      borderRadius: 12,
      padding: "14px 24px",
      marginBottom: 32,
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 55,
    }}>
      <Skeleton width={220} height={18} borderRadius={6} />
      <Skeleton width={80} height={13} borderRadius={6} />
    </div>
  );
}
