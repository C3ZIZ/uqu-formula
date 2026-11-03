// The dark asphalt header used at the top of most screens.
import type { ReactNode } from "react";
import { Slashes } from "./Slashes";

interface PageBandProps {
  title: string;
  lead?: string;
  children?: ReactNode;
}

/** Shows a screen's title on the textured band. */
export function PageBand({ title, lead, children }: PageBandProps) {
  return (
    <div className="band">
      <Slashes />
      <div className="content" style={{ position: "relative" }}>
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}
