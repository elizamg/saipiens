import Checkbox from "../ui/Checkbox";
import { GRAY_500 } from "../../theme/colors";
import type { Objective } from "../../types/domain";

interface ObjectiveRowProps {
  objective: Objective;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

export default function ObjectiveRow({
  objective,
  checked,
  onToggle,
}: ObjectiveRowProps) {
  const rowStyles: React.CSSProperties = {
    marginBottom: 12,
  };

  const descriptionStyles: React.CSSProperties = {
    margin: 0,
    marginLeft: 28,
    fontSize: 13,
    color: GRAY_500,
    lineHeight: 1.4,
  };

  return (
    <div style={rowStyles}>
      <Checkbox
        label={objective.title}
        checked={checked}
        onChange={(val) => onToggle(objective.id, val)}
      />
      {objective.description && (
        <p style={descriptionStyles}>{objective.description}</p>
      )}
    </div>
  );
}
